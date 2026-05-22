import React from 'react';
import { gsap } from 'gsap';
import { X, ExternalLink } from 'lucide-react';
import OTPFormField from '../ui/special/OTPFormField';
import type { FormField } from '../types/formTypeStructure';
import type { OTPServerResponse } from '../hooks/useOTPHandler';
import ValidationBtn from '../internal/button/ValidationBtn';
import CancelBtn from '../internal/button/CancelBtn';

interface OTPModalProps {
  isOpen: boolean;
  field: FormField;
  currentLang: string;
  formValues: Record<string, any>;
  serverResponse: OTPServerResponse | null;
  isSending: boolean;
  isResending?: boolean; // 🆕 État de renvoi en cours
  resendCooldown?: number; // 🆕 Cooldown restant en secondes
  otpValidated?: boolean; // 🆕 État de validation réussie
  onClose: () => void;
  onSendOTP: () => void;
  onValidateOTP: () => void; // 🆕 Fonction pour valider l'OTP
  onResendOTP?: () => void; // 🆕 Fonction pour renvoyer le code
  onCallbackRedirect: (url: string) => void;
  onSubmit?: () => void; // 🆕 Fonction pour soumettre le formulaire
  onNext?: () => void; // 🆕 Fonction pour aller à la section suivante
  isLastSection?: boolean; // 🆕 Indique si c'est la dernière section
  linkedEmail?: string | null;
  onOTPComplete?: (otpCode: string) => void; // 🆕 Callback quand le code est complet
}

const OTPModal: React.FC<OTPModalProps> = ({
  isOpen,
  field,
  currentLang,
  formValues,
  serverResponse,
  isSending,
  isResending = false,
  resendCooldown = 0,
  otpValidated = false,
  onClose,
  onSendOTP,
  onValidateOTP,
  onResendOTP,
  onCallbackRedirect,
  onSubmit,
  onNext,
  isLastSection = false,
  linkedEmail,
  onOTPComplete,
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Animation d'ouverture
  React.useEffect(() => {
    if (isOpen && modalRef.current) {
      gsap.set(modalRef.current, { display: "flex" });
      gsap.set(overlayRef.current, { opacity: 0 });
      gsap.set(contentRef.current, { scale: 0.9, opacity: 0, y: 20 });
      
      const tl = gsap.timeline();
      tl.to(overlayRef.current, { 
        opacity: 1, 
        duration: 0.15, 
        ease: "power2.out" 
      })
      .to(contentRef.current, { 
        scale: 1, 
        opacity: 1, 
        y: 0, 
        duration: 0.2, 
        ease: "power2.out" 
      }, "-=0.05");
    }
  }, [isOpen]);

  // Bloquer le scroll
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const hasCallbackUrl = serverResponse?.call_back_url && serverResponse?.call_back_url.trim() !== "";

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4"
      style={{ display: isOpen ? 'flex' : 'none' }}
    >
      {/* FULLSCREEN OVERLAY */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* MODAL CONTENT */}
      <div
        ref={contentRef}
        className="relative z-10 bg-white w-[90%] sm:w-auto max-w-md max-h-[95vh] sm:max-h-[90vh] rounded-xl shadow-xl overflow-hidden flex flex-col"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {typeof field.label === 'string' ? field.label : field.label[currentLang] || field.label['fr'] || 'Vérification OTP'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {field.helpText && (
            <p className="text-sm text-gray-600 mb-4">
              {typeof field.helpText === 'string' 
                ? field.helpText 
                : field.helpText[currentLang] || field.helpText['fr'] || ''}
            </p>
          )}

          {/* Afficher l'email lié si disponible */}
          {linkedEmail && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Code envoyé à : <span className="font-semibold">{linkedEmail}</span>
              </p>
            </div>
          )}

          <OTPFormField
            field={field as FormField & { fieldType: "OTP" }}
            currentLang={currentLang}
            onOTPComplete={onOTPComplete}
          />

          {/* 🆕 Bouton "Renvoyer le code" */}
          {field.otpFormFieldExecOptions?.enableResend !== false && !otpValidated && linkedEmail && onResendOTP && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <p className="text-sm text-gray-600">
                Vous n'avez pas reçu le code ?
              </p>
              <button
                type="button"
                onClick={onResendOTP}
                disabled={isResending || resendCooldown > 0}
                className="text-sm text-teal-600 hover:text-teal-800 font-medium disabled:text-gray-400 disabled:cursor-not-allowed transition-colors underline"
              >
                {isResending 
                  ? "Envoi en cours..." 
                  : resendCooldown > 0 
                    ? `Renvoyer (${resendCooldown}s)` 
                    : "Renvoyer le code"}
              </button>
            </div>
          )}

          {/* Affichage des messages serveur */}
          {serverResponse?.message && (
            <div className={`mt-4 p-3 rounded-lg ${
              serverResponse.success 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <p className="text-sm">{serverResponse.message}</p>
            </div>
          )}

          {/* Lien de redirection si call_back_url présent */}
          {hasCallbackUrl && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 mb-3">
                Continuer sur :
              </p>
              <button
                type="button"
                onClick={() => onCallbackRedirect(serverResponse!.call_back_url!)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                <ExternalLink size={16} />
                <span className="underline break-all">{serverResponse!.call_back_url}</span>
              </button>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          {!otpValidated && (
            <CancelBtn
              type="button"
              onClick={onClose}
            >
              Annuler
            </CancelBtn>
          )}
          
          {hasCallbackUrl && (
            <ValidationBtn
              type="button"
              onClick={() => onCallbackRedirect(serverResponse!.call_back_url!)}
            >
              Continuer sur
            </ValidationBtn>
          )}
          
          {!hasCallbackUrl && !otpValidated && (
            <ValidationBtn
              type="button"
              onClick={onValidateOTP}
              disabled={isSending}
            >
              {isSending ? 'Validation en cours...' : 'Valider OTP'}
            </ValidationBtn>
          )}
          
          {!hasCallbackUrl && otpValidated && (
            <ValidationBtn
              type="button"
              onClick={isLastSection && onSubmit ? onSubmit : onNext}
            >
              {isLastSection ? 'Soumettre le formulaire' : 'Continuer'}
            </ValidationBtn>
          )}
        </div>
      </div>
    </div>
  );
};

export default OTPModal;

