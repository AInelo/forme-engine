import React, { useEffect, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import OTPModal from './OTPModal';
import { useOTPHandler } from '../hooks/useOTPHandler';
import type { FormField, Section } from '../types/formTypeStructure';
import { findLinkedEmailField, findSectionIndexForField } from '../types/formUtils';
import { useOTPTokenStore } from '../store/useOTPTokenStore';

interface OTPRendererProps {
  field: FormField;
  formValues: Record<string, any>;
  formId?: string; // 🆕 ID du formulaire pour stocker le token
  currentLang?: string;
  onClearForm: () => void;
  allSections?: Section[];
  onSubmit?: () => void; // 🆕 Fonction pour soumettre le formulaire
  onNext?: () => void; // 🆕 Fonction pour aller à la section suivante
  isLastSection?: boolean; // 🆕 Indique si c'est la dernière section
}

const OTPRenderer: React.FC<OTPRendererProps> = ({
  field,
  formValues,
  formId,
  currentLang = "fr",
  onClearForm,
  allSections = [],
  onSubmit,
  onNext,
  isLastSection = false,
}) => {
  const { getValues, watch } = useFormContext();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  
  // Surveiller la valeur de l'OTP pour la validation
  const otpValue = watch(field.fieldName);

  // Trouver le champ Email lié (dans une section précédente)
  const otpSectionIndex = useMemo(() => {
    return findSectionIndexForField(field.fieldName, allSections);
  }, [field.fieldName, allSections]);
  
  const linkedEmailField = useMemo(() => {
    if (otpSectionIndex === -1) return undefined;
    return findLinkedEmailField(field, allSections, otpSectionIndex);
  }, [field, allSections, otpSectionIndex]);
  
  const linkedEmail = linkedEmailField 
    ? formValues[linkedEmailField.fieldName]
    : null;

  const {
    sendOTP,
    validateOTP,
    resendOTP,
    resetOTPSentState,
    handleCallbackRedirect,
    isSending,
    isResending,
    resendCooldown,
    otpSent,
    otpValidated,
    serverResponse,
    error,
  } = useOTPHandler(field.otpFormFieldExecOptions, formId, field.fieldName);

  // Ouvrir le modal automatiquement au montage
  useEffect(() => {
    if (!isModalOpen) {
      setTimeout(() => {
        setIsModalOpen(true);
      }, 300);
    }
  }, [isModalOpen]);

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSendOTP = async () => {
    try {
      const formData = getValues();
      await sendOTP(formData);
    } catch (err) {
      console.error("Erreur lors de l'envoi de l'OTP:", err);
    }
  };

  const handleValidateOTP = async () => {
    try {
      const formData = getValues();
      // Récupérer la valeur OTP (peut être une string ou un objet)
      let otpCode = "";
      if (typeof otpValue === "string") {
        otpCode = otpValue;
      } else if (otpValue && typeof otpValue === "object" && otpValue.otp) {
        otpCode = otpValue.otp;
      } else {
        // Essayer de récupérer directement depuis formValues
        otpCode = formValues[field.fieldName] || "";
        if (typeof otpCode !== "string") {
          otpCode = "";
        }
      }
      
      const otpLength = field.otpFormFieldExecOptions?.otpLength ?? 6;
      if (!otpCode || otpCode.length !== otpLength) {
        toast.error(`Code OTP incomplet. Le code doit contenir ${otpLength} chiffres.`);
        return;
      }
      
      await validateOTP(otpCode, formData);
      // Si la validation réussit, un toast de succès sera affiché dans la modale via serverResponse
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de la validation de l'OTP";
      toast.error(`❌ ${errorMessage}`);
      console.error("Erreur lors de la validation de l'OTP:", err);
    }
  };

  const clearAllOTPTokens = useOTPTokenStore((state) => state.clearAllOTPTokens);
  
  const handleCallbackRedirectWrapper = (url: string) => {
    // Nettoyer les tokens OTP avant de rediriger
    if (formId) {
      clearAllOTPTokens(formId);
    }
    handleCallbackRedirect(url, onClearForm);
  };

  // 🆕 Auto-validation si activée
  const autoValidate = field.otpFormFieldExecOptions?.autoValidate ?? false;
  
  const handleOTPComplete = React.useCallback(async (otpCode: string) => {
    if (autoValidate && !otpValidated && !isSending) {
      try {
        const formData = getValues();
        await validateOTP(otpCode, formData);
        // Si la validation réussit, un toast de succès sera affiché dans la modale via serverResponse
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Code OTP invalide";
        toast.error(`❌ ${errorMessage}`);
        console.error("Erreur lors de l'auto-validation de l'OTP:", err);
      }
    }
  }, [autoValidate, otpValidated, isSending, validateOTP, getValues]);

  // 🆕 Fonction pour renvoyer le code
  const handleResendOTP = async () => {
    try {
      const formData = getValues();
      // Réinitialiser l'état avant de renvoyer
      resetOTPSentState();
      await resendOTP(formData);
      toast.success("Code OTP renvoyé avec succès !");
    } catch (err) {
      console.error("Erreur lors du renvoi de l'OTP:", err);
      toast.error(err instanceof Error ? err.message : "Erreur lors du renvoi du code");
    }
  };

  return (
    <OTPModal
      isOpen={isModalOpen}
      field={field}
      currentLang={currentLang}
      formValues={formValues}
      serverResponse={serverResponse}
      isSending={isSending}
      isResending={isResending}
      resendCooldown={resendCooldown}
      otpValidated={otpValidated}
      onClose={closeModal}
      onSendOTP={handleSendOTP}
      onValidateOTP={handleValidateOTP}
      onResendOTP={handleResendOTP}
      onCallbackRedirect={handleCallbackRedirectWrapper}
      onSubmit={onSubmit}
      onNext={onNext}
      isLastSection={isLastSection}
      linkedEmail={linkedEmail}
      onOTPComplete={autoValidate ? handleOTPComplete : undefined}
    />
  );
};

export default OTPRenderer;

