import { useEffect, useCallback, useState, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import toast from 'react-hot-toast';
import type { FormField, Section } from '../types/formTypeStructure';
import { findLinkedOTPField } from '../types/formUtils';

interface UseEmailOTPTriggerProps {
  emailField: FormField;
  allSections: Section[];
  currentSectionIndex: number;
  onOTPSent?: (email: string) => void;
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

export const useEmailOTPTrigger = ({
  emailField,
  allSections,
  currentSectionIndex,
  onOTPSent,
}: UseEmailOTPTriggerProps) => {
  const { watch, trigger, formState } = useFormContext();
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSentEmail, setLastSentEmail] = useState<string | null>(null);
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  const emailValue = watch(emailField.fieldName);
  
  // Trouver le champ OTP lié (dans une section suivante)
  const linkedOTPField = findLinkedOTPField(
    emailField,
    allSections,
    currentSectionIndex
  );

  const sendOTP = useCallback(async (email: string) => {
    if (!emailField.emailFormFieldExecOptions?.otpSendApiConfig) {
      console.warn("Email field does not have OTP send API configuration");
      return;
    }

    // Éviter les envois multiples simultanés
    if (isProcessingRef.current) {
      return;
    }

    const config = emailField.emailFormFieldExecOptions.otpSendApiConfig;
    setIsSendingOTP(true);
    setError(null);
    isProcessingRef.current = true;

    try {
      const url = `${config.serverDns}${config.postApiEndPoint}`;
      const basePayload = normalizePayload(config.payload);
      const payload = {
        ...basePayload,
        email,
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(config.extraHeaders || {}),
      };

      if (config.bearer) {
        headers.Authorization = `Bearer ${config.bearer}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`OTP send failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      setOtpSent(true);
      setLastSentEmail(email);
      onOTPSent?.(email);
      
      toast.success(`Code OTP envoyé à ${email}`, {
        duration: 3000,
        position: "top-center",
      });
      
      console.log(`✅ OTP envoyé à ${email}`, result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send OTP";
      setError(message);
      toast.error(`Erreur lors de l'envoi de l'OTP: ${message}`, {
        duration: 4000,
        position: "top-center",
      });
      throw err;
    } finally {
      setIsSendingOTP(false);
      isProcessingRef.current = false;
    }
  }, [emailField, onOTPSent]);

  // Déclencher l'envoi automatique quand l'email est validé
  useEffect(() => {
    // Nettoyer le timer précédent
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Vérifier si c'est le champ email qui a changé
    const email = emailValue;
    
    // Vérifier que l'email est valide et non vide
    if (!email || typeof email !== "string" || email.trim() === "") {
      return;
    }

    // Vérifier que le champ doit déclencher l'envoi d'OTP
    if (!emailField.emailFormFieldExecOptions?.triggerOTPSend) {
      return;
    }

    // Vérifier qu'un champ OTP est bien lié
    if (!linkedOTPField) {
      return;
    }

    // Si l'email n'a pas changé et qu'on a déjà envoyé l'OTP, ne pas réenvoyer
    if (email === lastSentEmail && otpSent) {
      return;
    }

    // Débounce : attendre 500ms après la dernière modification
    debounceTimerRef.current = setTimeout(async () => {
      try {
        // Valider l'email avant d'envoyer
        const isValid = await trigger(emailField.fieldName);
        if (!isValid) {
          console.log("Email validation failed, not sending OTP");
          return;
        }

        // Réinitialiser l'état si l'email a changé
        if (email !== lastSentEmail) {
          setOtpSent(false);
          setError(null);
        }

        // Envoyer l'OTP
        await sendOTP(email);
      } catch (err) {
        console.error("Erreur lors de l'envoi automatique de l'OTP:", err);
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    emailValue,
    emailField,
    trigger,
    otpSent,
    sendOTP,
    linkedOTPField,
    lastSentEmail,
  ]);

  // Réinitialiser l'état si l'email change complètement
  useEffect(() => {
    if (emailValue !== lastSentEmail && lastSentEmail !== null) {
      setOtpSent(false);
      setError(null);
    }
  }, [emailValue, lastSentEmail]);

  return {
    isSendingOTP,
    otpSent,
    error,
    sendOTP,
    linkedOTPField,
    lastSentEmail,
  };
};

