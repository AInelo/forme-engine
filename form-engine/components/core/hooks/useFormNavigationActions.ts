import toast from "react-hot-toast";
import type { FormValidationResult } from "../types/formEngine.types";
import type { FormStructure, FormField, Section } from "../../../types/formTypeStructure";
import {
  hasOTPField,
  getOTPField,
  findLinkedEmailField,
  findSectionIndexForField,
} from "../../../types/formUtils";

const buildAbsoluteUrl = (serverDns: string, endpoint: string): string => {
  const base = serverDns.replace(/\/+$/, "");
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }
  const path = endpoint.replace(/^\/+/, "");
  return `${base}/${path}`;
};

const getNextSectionIndex = (
  currentSectionIndex: number,
  currentFieldPage: number,
  form: FormStructure,
  paginationMode: "byFields" | "bySection",
  fieldsPerPage: number = 4
): number => {
  if (paginationMode === "bySection") {
    if (currentSectionIndex < form.sections.length - 1) {
      return currentSectionIndex + 1;
    }
    return -1;
  }

  const currentSection = form.sections[currentSectionIndex];
  const totalFields = currentSection.formFields?.length || 0;
  const totalFieldPages = Math.ceil(totalFields / fieldsPerPage);

  if (currentFieldPage < totalFieldPages - 1) {
    return currentSectionIndex;
  }
  if (currentSectionIndex < form.sections.length - 1) {
    return currentSectionIndex + 1;
  }
  return -1;
};

const sendOTPBeforeNavigation = async (
  otpField: FormField,
  formValues: Record<string, any>,
  allSections: Section[]
): Promise<void> => {
  const options = otpField.otpFormFieldExecOptions;
  if (!options) {
    throw new Error("OTP options are not configured for this field");
  }

  const sendConfig = options.sendOTPApiConfig ?? {
    serverDns: options.serverDns,
    postApiEndPoint: options.postApiEndPoint,
    payload: options.payload,
    extraHeaders: options.extraHeaders,
    bearer: options.bearer,
  };

  const otpSectionIndex = findSectionIndexForField(otpField.fieldName, allSections);
  const linkedEmailField = findLinkedEmailField(otpField, allSections, otpSectionIndex);

  if (!linkedEmailField) {
    throw new Error(`Linked field not found for OTP field: ${otpField.fieldName}`);
  }

  const linkedFieldValue = formValues[linkedEmailField.fieldName];
  if (!linkedFieldValue) {
    throw new Error(`Le champ lié "${linkedEmailField.fieldName}" est vide`);
  }

  const url = buildAbsoluteUrl(sendConfig.serverDns, sendConfig.postApiEndPoint);

  const basePayload = sendConfig.payload ?? {};
  const mergedPayload = {
    ...basePayload,
    ...formValues,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(sendConfig.extraHeaders ?? {}),
  };
  if (sendConfig.bearer) {
    headers.Authorization = `Bearer ${sendConfig.bearer}`;
  }

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs || 15000;

  const fetchPromise = fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(mergedPayload),
    signal: controller.signal,
  });

  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchPromise;
    clearTimeout(timeoutId);

    let responseData: any = null;
    try {
      responseData = await response.json();
    } catch {
      const text = await response.text();
      throw new Error(`Réponse OTP invalide: ${text}`);
    }

    if (!response.ok) {
      const errorMessage =
        responseData?.message ||
        `OTP request failed with status ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const success = responseData?.success;
    if (success === false && response.status !== 200) {
      throw new Error(responseData?.message || "Échec de l'envoi du code OTP");
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Délai d'attente dépassé pour la requête OTP");
    }
    throw error;
  }
};

const useFormNavigationActions = (
  navigation: any,
  validatePage: () => Promise<FormValidationResult>,
  _isValidating: boolean,
  setIsValidating: (value: boolean) => void,
  form: FormStructure,
  formValues: Record<string, any>,
  paginationMode: "byFields" | "bySection",
  fieldsPerPage: number = 4
) => {
  const handleNext = async () => {
    setIsValidating(true);
    try {
      const result = await validatePage();

      if (result.invalidFields && result.invalidFields.length > 0) {
        result.invalidFields.forEach((field) => {
          field.errors.forEach((error) => {
            toast.error(`${field.fieldLabel} : ${error}`);
          });
        });
        return;
      }

      if (result.emptyRequiredFields && result.emptyRequiredFields.length > 0) {
        result.emptyRequiredFields.forEach((field) => {
          toast.error(`${field.fieldLabel} : ${field.errors[0]}`);
        });
        return;
      }

      if (result.untouchedRequiredFields && result.untouchedRequiredFields.length > 0) {
        result.untouchedRequiredFields.forEach((field) => {
          toast.error(`${field.fieldLabel} : ${field.errors[0]}`);
        });
        return;
      }

      // 🆕 Vérifier si la section actuelle contient un champ OTP non validé
      // Cette vérification complète celle de useFormPageValidation en ajoutant un message plus explicite
      const currentSection = form.sections[navigation.sectionIndex];
      if (currentSection && hasOTPField(currentSection)) {
        const otpField = getOTPField(currentSection);
        if (otpField) {
          const otpValue = formValues[otpField.fieldName];
          const otpLength = otpField.otpFormFieldExecOptions?.otpLength ?? 6;
          const isOTPRequired = otpField.validations?.some(
            (v) => v.validationType === "required"
          );

          // Vérifier si l'OTP est requis mais non rempli ou incomplet
          if (isOTPRequired) {
            if (
              !otpValue ||
              typeof otpValue !== "string" ||
              otpValue.length !== otpLength
            ) {
              toast.error(
                `⚠️ Veuillez remplir et valider le code OTP avant de continuer. Le code doit contenir ${otpLength} chiffres.`
              );
              return;
            }
            // Si l'OTP est rempli avec la bonne longueur, la validation dans useFormPageValidation
            // devrait avoir vérifié qu'il est valide. Si on arrive ici, c'est que la validation a passé,
            // donc on peut continuer la navigation.
          }
        }
      }

      const nextSectionIndex = getNextSectionIndex(
        navigation.sectionIndex,
        navigation.fieldPage,
        form,
        paginationMode,
        fieldsPerPage
      );

      if (nextSectionIndex !== -1) {
        const nextSection = form.sections[nextSectionIndex];
        if (hasOTPField(nextSection)) {
          const otpField = getOTPField(nextSection);
          if (otpField) {
            try {
              await sendOTPBeforeNavigation(otpField, formValues, form.sections);
              toast.success("Code de vérification envoyé !");
            } catch (err: any) {
              const message =
                err instanceof Error ? err.message : "Erreur lors de l'envoi du code OTP";
              toast.error(message);
              return;
            }
          }
        }
      }

      if (navigation.goToNextVisible) {
        navigation.goToNextVisible();
      } else {
        navigation.goToNext();
      }
      toast.success(
        `Super section suivante ! 🎉 (${result.requiredFieldsCount}/${result.visibleFieldsCount} champs requis)`
      );
    } finally {
      setIsValidating(false);
    }
  };

  return { handleNext };
};

export default useFormNavigationActions;