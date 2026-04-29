import { useState, useCallback } from 'react';
import type { OTPFormFieldExecOptions } from '../types/formTypeStructure';
import { useOTPTokenStore } from '../store/useOTPTokenStore';

export interface OTPAuthToken {
  access_token: string;
  token_type?: string; // "bearer" par défaut
  expires_in?: number; // en secondes
  expires_at?: number; // timestamp Unix (calculé depuis expires_in)
}

export interface OTPServerResponse {
  success: boolean;
  call_back_url?: string;
  message?: string;
  // Nouveau : Token d'authentification
  authToken?: OTPAuthToken;
  // Support pour différents formats de réponse
  access_token?: string; // Format direct depuis l'API
  token_type?: string;
  expires_in?: number;
}

const isMap = (
  payload?: Map<string, unknown> | Record<string, unknown>
): payload is Map<string, unknown> => payload instanceof Map;

const normalizePayload = (
  payload?: Map<string, unknown> | Record<string, unknown>
): Record<string, unknown> => {
  if (!payload) {
    return {};
  }
  if (isMap(payload)) {
    return Object.fromEntries(payload.entries());
  }
  return { ...payload };
};

const buildAbsoluteUrl = (serverDns: string, endpoint: string): string => {
  const base = serverDns.replace(/\/+$/, "");
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }
  const path = endpoint.replace(/^\/+/, "");
  return `${base}/${path}`;
};

const withTimeout = <T,>(
  promise: Promise<T>,
  timeoutMs?: number,
  controller?: AbortController
): Promise<T> => {
  if (!timeoutMs || timeoutMs <= 0 || !controller) {
    return promise;
  }

  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return promise.finally(() => {
    clearTimeout(timeout);
  });
};

// Fonction pour extraire le token depuis différentes structures de réponse
const extractAuthToken = (responseData: Record<string, any>): OTPAuthToken | null => {
  // Chercher la clé qui contient "token" (insensible à la casse)
  const tokenKey = Object.keys(responseData).find(
    (key) => key.toLowerCase().includes('token') && typeof responseData[key] === 'string'
  );
  
  if (!tokenKey) {
    return null;
  }
  
  const tokenValue = responseData[tokenKey];
  if (!tokenValue || typeof tokenValue !== 'string') {
    return null;
  }
  
  // Construire OTPAuthToken
  const authToken: OTPAuthToken = {
    access_token: tokenValue,
    token_type: responseData.token_type || responseData.tokenType || 'bearer',
    expires_in: responseData.expires_in || responseData.expiresIn,
  };
  
  // Calculer expires_at si expires_in est présent
  if (authToken.expires_in) {
    authToken.expires_at = Math.floor(Date.now() / 1000) + authToken.expires_in;
  }
  
  return authToken;
};

export const useOTPHandler = (
  options?: OTPFormFieldExecOptions,
  formId?: string,
  fieldName?: string
) => {
  const [isSending, setIsSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpValidated, setOtpValidated] = useState(false); // 🆕 État pour la validation réussie
  const [serverResponse, setServerResponse] = useState<OTPServerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0); // 🆕 Cooldown en secondes
  const [isResending, setIsResending] = useState(false); // 🆕 État pour le renvoi
  
  const setOTPToken = useOTPTokenStore((state) => state.setOTPToken);

  const sendOTP = useCallback(
    async (formData: Record<string, any>): Promise<OTPServerResponse> => {
      if (!options) {
        throw new Error("OTP options are not configured for this field");
      }

      setIsSending(true);
      setError(null);

      try {
        const controller = new AbortController();
        const url = buildAbsoluteUrl(options.serverDns, options.postApiEndPoint);
        
        // Normaliser et fusionner le payload
        const basePayload = normalizePayload(options.payload);
        const mergedPayload = {
          ...basePayload,
          ...formData, // Fusionner avec les données du formulaire
        };

        // Préparer les headers
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(options.extraHeaders ?? {}),
        };

        if (options.bearer) {
          headers.Authorization = `Bearer ${options.bearer}`;
        }

        // Envoyer la requête POST
        const fetchPromise = fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(mergedPayload),
          signal: controller.signal,
        });

        const response = await withTimeout(
          fetchPromise,
          options.timeoutMs,
          controller
        );

        let payload: any = null;
        try {
          payload = await response.json();
        } catch {
          // Si la réponse n'est pas du JSON, essayer de lire le texte
          const text = await response.text();
          throw new Error(`Invalid JSON response: ${text}`);
        }

        if (!response.ok) {
          const message =
            payload?.message ??
            `OTP request failed with status ${response.status} ${response.statusText}`;
          throw new Error(message);
        }

        // 🎯 Gestion spéciale pour httpbin.org (mock endpoint)
        // httpbin.org/post retourne les données dans payload.json
        let responseData = payload;
        if (payload?.json) {
          // Format httpbin.org
          responseData = payload.json;
        }

        // 🎯 Simulation de réponse OTP pour les tests
        // Si on utilise httpbin.org, simuler une réponse réussie
        const isHttpbin = url.includes("httpbin.org");
        if (isHttpbin) {
          // Simuler une réponse OTP réussie
          // Pour tester call_back_url, décommenter la ligne suivante:
          // const serverResponse: OTPServerResponse = {
          //   success: true,
          //   call_back_url: "https://example.com/redirect",
          //   message: "OTP vérifié avec succès (simulation)",
          // };
          
          // Réponse normale (sans redirection)
          const serverResponse: OTPServerResponse = {
            success: true,
            message: "OTP vérifié avec succès (simulation httpbin)",
          };
          
          setOtpSent(true);
          setServerResponse(serverResponse);
          return serverResponse;
        }

        // Construire la réponse standardisée pour les vrais endpoints
        const serverResponse: OTPServerResponse = {
          success: responseData?.success ?? true,
          call_back_url: responseData?.call_back_url ?? responseData?.callback_url ?? responseData?.callBackUrl,
          message: responseData?.message,
        };

        setOtpSent(true);
        setServerResponse(serverResponse);

        return serverResponse;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unexpected OTP error";
        setError(message);
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [options]
  );

  const handleCallbackRedirect = useCallback(
    (url: string, clearForm: () => void) => {
      // Vider le formulaire
      clearForm();
      
      // Rediriger vers l'URL
      window.location.href = url;
    },
    []
  );

  // 🆕 Fonction pour valider l'OTP (vérifie si le code est "123456" pour la simulation)
  const validateOTP = useCallback(
    async (otpCode: string, formData: Record<string, any>): Promise<OTPServerResponse> => {
      if (!options) {
        throw new Error("OTP options are not configured for this field");
      }

      setIsSending(true);
      setError(null);

      try {
        // 🎯 Simulation : "123456" est le code OTP correct
        const CORRECT_OTP = "123456";
        
        // Simuler un délai de validation
        await new Promise(resolve => setTimeout(resolve, 800));

        if (otpCode !== CORRECT_OTP) {
          const errorMessage = "Code OTP invalide. Veuillez réessayer.";
          setError(errorMessage);
          throw new Error(errorMessage);
        }

        // Code OTP correct - simuler l'appel API
        const controller = new AbortController();
        const url = buildAbsoluteUrl(options.serverDns, options.postApiEndPoint);
        
        // Normaliser et fusionner le payload
        const basePayload = normalizePayload(options.payload);
        const mergedPayload = {
          ...basePayload,
          ...formData,
          otpCode, // Ajouter le code OTP au payload
        };

        // Préparer les headers
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(options.extraHeaders ?? {}),
        };

        if (options.bearer) {
          headers.Authorization = `Bearer ${options.bearer}`;
        }

        // Envoyer la requête POST
        const fetchPromise = fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(mergedPayload),
          signal: controller.signal,
        });

        const response = await withTimeout(
          fetchPromise,
          options.timeoutMs,
          controller
        );

        let payload: any = null;
        try {
          payload = await response.json();
        } catch {
          const text = await response.text();
          throw new Error(`Invalid JSON response: ${text}`);
        }

        if (!response.ok) {
          const message =
            payload?.message ??
            `OTP validation failed with status ${response.status} ${response.statusText}`;
          throw new Error(message);
        }

        // 🎯 Gestion spéciale pour httpbin.org (mock endpoint)
        let responseData = payload;
        if (payload?.json) {
          responseData = payload.json;
        }

        const isHttpbin = url.includes("httpbin.org");
        if (isHttpbin) {
          // Simulation : OTP validé avec succès
          // Extraire le token même pour httpbin (si présent dans la réponse)
          const authToken = extractAuthToken(responseData);
          
          const serverResponse: OTPServerResponse = {
            success: true,
            message: "Code OTP validé avec succès",
            authToken: authToken || undefined,
            access_token: responseData?.access_token || responseData?.accessToken,
            token_type: responseData?.token_type || responseData?.tokenType,
            expires_in: responseData?.expires_in || responseData?.expiresIn,
          };
          
          // Stocker le token si présent et si formId/fieldName sont fournis
          if (authToken && formId && fieldName) {
            setOTPToken(formId, fieldName, authToken);
            console.log('✅ [OTP] Token d\'authentification stocké (httpbin):', { formId, fieldName });
          }
          
          setOtpValidated(true);
          setOtpSent(true);
          setServerResponse(serverResponse);
          return serverResponse;
        }

        // Construire la réponse standardisée pour les vrais endpoints
        const success = responseData?.success ?? true;
        
        // Extraire le token d'authentification depuis la réponse
        const authToken = extractAuthToken(responseData);
        
        const serverResponse: OTPServerResponse = {
          success,
          call_back_url: responseData?.call_back_url ?? responseData?.callback_url ?? responseData?.callBackUrl,
          message: responseData?.message ?? "Code OTP validé avec succès",
          authToken: authToken || undefined,
          // Support pour format direct
          access_token: responseData?.access_token || responseData?.accessToken,
          token_type: responseData?.token_type || responseData?.tokenType,
          expires_in: responseData?.expires_in || responseData?.expiresIn,
        };

        // Si le serveur retourne success: false, lancer une erreur
        if (success === false) {
          const errorMessage = responseData?.message || "Code OTP invalide. Veuillez réessayer.";
          setError(errorMessage);
          throw new Error(errorMessage);
        }

        // Stocker le token si présent et si formId/fieldName sont fournis
        if (authToken && formId && fieldName) {
          setOTPToken(formId, fieldName, authToken);
          console.log('✅ [OTP] Token d\'authentification stocké:', { formId, fieldName });
        }

        setOtpValidated(true);
        setOtpSent(true);
        setServerResponse(serverResponse);

        return serverResponse;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur lors de la validation de l'OTP";
        setError(message);
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [options, formId, fieldName, setOTPToken]
  );

  // 🆕 Fonction pour réinitialiser l'état d'envoi (pour permettre le renvoi)
  const resetOTPSentState = useCallback(() => {
    setOtpSent(false);
    setServerResponse(null);
    setError(null);
    setOtpValidated(false);
  }, []);

  // 🆕 Fonction pour renvoyer le code OTP
  const resendOTP = useCallback(
    async (formData: Record<string, any>): Promise<OTPServerResponse> => {
      if (!options) {
        throw new Error("OTP options are not configured for this field");
      }

      const cooldown = options.resendCooldownSeconds ?? 60;
      
      if (resendCooldown > 0) {
        throw new Error(`Veuillez attendre ${resendCooldown} secondes avant de renvoyer le code`);
      }

      setIsResending(true);
      setError(null);

      try {
        // Utiliser la config d'envoi initiale si disponible, sinon la config de vérification
        const sendConfig = options.sendOTPApiConfig || {
          serverDns: options.serverDns,
          postApiEndPoint: options.postApiEndPoint,
          payload: options.payload,
          extraHeaders: options.extraHeaders,
          bearer: options.bearer,
        };

        const controller = new AbortController();
        const url = buildAbsoluteUrl(sendConfig.serverDns, sendConfig.postApiEndPoint);
        
        const basePayload = normalizePayload(sendConfig.payload);
        const mergedPayload = {
          ...basePayload,
          ...formData,
        };

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(sendConfig.extraHeaders ?? {}),
        };

        if (sendConfig.bearer) {
          headers.Authorization = `Bearer ${sendConfig.bearer}`;
        }

        const fetchPromise = fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(mergedPayload),
          signal: controller.signal,
        });

        const response = await withTimeout(
          fetchPromise,
          options.timeoutMs,
          controller
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(errorData.message || `OTP resend failed with status ${response.status}`);
        }

        const result = await response.json();
        
        // Démarrer le cooldown
        setResendCooldown(cooldown);
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        setOtpSent(true);
        return { success: true, message: "Code OTP renvoyé avec succès" };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur lors du renvoi du code";
        setError(message);
        throw err;
      } finally {
        setIsResending(false);
      }
    },
    [options, resendCooldown]
  );

  const reset = useCallback(() => {
    setIsSending(false);
    setOtpSent(false);
    setOtpValidated(false);
    setServerResponse(null);
    setError(null);
    setResendCooldown(0);
    setIsResending(false);
  }, []);

  return {
    sendOTP,
    validateOTP, // 🆕 Nouvelle fonction pour valider l'OTP
    resendOTP, // 🆕 Fonction pour renvoyer le code
    resetOTPSentState, // 🆕 Réinitialiser l'état d'envoi
    handleCallbackRedirect,
    isSending,
    isResending, // 🆕 État de renvoi en cours
    resendCooldown, // 🆕 Cooldown restant en secondes
    otpSent,
    otpValidated, // 🆕 État de validation réussie
    serverResponse,
    error,
    reset,
  };
};

