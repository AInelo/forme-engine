// ================================
// 1. TYPES ET INTERFACES
// ================================

import { useState } from "react";
import toast from "react-hot-toast";

export interface ToastConfig {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  style?: React.CSSProperties;
  icon?: string;
  className?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  config?: ToastConfig;
}

export interface FormToastMessages {
  validation: {
    invalidFields: string;
    incompleteFields: string;
    requiredFieldsMissing: string;
  };
  navigation: {
    nextSuccess: (requiredCount: number, totalCount: number) => string;
  };
  submission: {
    success: (requiredCount: number) => string;
    error: string;
  };
  reset: {
    success: string;
    error: string;
  };
}



// ================================
// 2. CONFIGURATION DES MESSAGES
// ================================

export const FORM_TOAST_MESSAGES: FormToastMessages = {
  validation: {
    invalidFields: "Des champs sont invalides ou incomplets ⚠️",
    incompleteFields: "Merci de compléter tous les champs avant de continuer ✋",
    requiredFieldsMissing: "Tous les champs obligatoires doivent être remplis 📝"
  },
  navigation: {
    nextSuccess: (requiredCount: number, totalCount: number) => 
      `Super section suivante ! 🎉 (${requiredCount}/${totalCount} champs requis)`
  },
  submission: {
    success: (requiredCount: number) => 
      `Formulaire soumis avec succès ! 🎉 (${requiredCount} champs requis traités)`,
    error: "Erreur lors de la soumission du formulaire"
  },
  reset: {
    success: "Toutes les données ont été supprimées ! 🗑️",
    error: "Erreur lors de la suppression des données"
  }
};

// ================================
// 3. STYLES PRÉDÉFINIS
// ================================

export const TOAST_STYLES = {
  success: {
    background: "#10b981",
    color: "white",
    fontWeight: "bold" as const,
  },
  error: {
    background: "#ef4444",
    color: "white",
    fontWeight: "bold" as const,
  },
  warning: {
    background: "#f59e0b",
    color: "white",
    fontWeight: "bold" as const,
  },
  info: {
    background: "#3b82f6",
    color: "white",
    fontWeight: "bold" as const,
  }
};

export const TOAST_ICONS = {
  success: "✅",
  error: "❌",
  warning: "⚠️",
  info: "ℹ️"
};

// ================================
// 4. CONFIGURATIONS PRÉDÉFINIES
// ================================

export const TOAST_CONFIGS = {
  default: {
    duration: 3000,
    position: "top-center" as const,
  },
  success: {
    duration: 3000,
    position: "top-center" as const,
    style: TOAST_STYLES.success,
    icon: TOAST_ICONS.success,
  },
  error: {
    duration: 4000,
    position: "top-center" as const,
    style: TOAST_STYLES.error,
    icon: TOAST_ICONS.error,
  },
  warning: {
    duration: 3500,
    position: "top-center" as const,
    style: TOAST_STYLES.warning,
    icon: TOAST_ICONS.warning,
  },
  info: {
    duration: 3000,
    position: "top-center" as const,
    style: TOAST_STYLES.info,
    icon: TOAST_ICONS.info,
  }
};

// ================================
// 5. INTERFACE POUR LES NOTIFICATIONS
// ================================

export interface IToastNotifier {
  showSuccess: (message: string, config?: ToastConfig) => void;
  showError: (message: string, config?: ToastConfig) => void;
  showWarning: (message: string, config?: ToastConfig) => void;
  showInfo: (message: string, config?: ToastConfig) => void;
  dismiss: (toastId?: string) => void;
}

// ================================
// 6. IMPLÉMENTATION AVEC REACT-HOT-TOAST
// ================================

class ReactHotToastNotifier implements IToastNotifier {
  private mergeConfig(type: keyof typeof TOAST_CONFIGS, customConfig?: ToastConfig): ToastConfig {
    return {
      ...TOAST_CONFIGS[type],
      ...customConfig,
    };
  }

  showSuccess(message: string, config?: ToastConfig): void {
    const finalConfig = this.mergeConfig('success', config);
    toast.success(message, finalConfig);
  }

  showError(message: string, config?: ToastConfig): void {
    const finalConfig = this.mergeConfig('error', config);
    toast.error(message, finalConfig);
  }

  showWarning(message: string, config?: ToastConfig): void {
    const finalConfig = this.mergeConfig('warning', config);
    toast(message, finalConfig);
  }

  showInfo(message: string, config?: ToastConfig): void {
    const finalConfig = this.mergeConfig('info', config);
    toast(message, finalConfig);
  }

  dismiss(toastId?: string): void {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }
}

// ================================
// 7. NOTIFICATEUR POUR LES FORMULAIRES
// ================================

export class FormToastNotifier {
  private notifier: IToastNotifier;
  private messages: FormToastMessages;

  constructor(notifier: IToastNotifier, messages: FormToastMessages = FORM_TOAST_MESSAGES) {
    this.notifier = notifier;
    this.messages = messages;
  }

  // Validation
  showValidationError(type: 'invalidFields' | 'incompleteFields' | 'requiredFieldsMissing'): void {
    this.notifier.showError(this.messages.validation[type]);
  }

  // Navigation
  showNavigationSuccess(requiredCount: number, totalCount: number): void {
    const message = this.messages.navigation.nextSuccess(requiredCount, totalCount);
    this.notifier.showSuccess(message);
  }

  // Soumission
  showSubmissionSuccess(requiredCount: number): void {
    const message = this.messages.submission.success(requiredCount);
    this.notifier.showSuccess(message);
  }

  showSubmissionError(customMessage?: string): void {
    const message = customMessage || this.messages.submission.error;
    this.notifier.showError(message);
  }

  // Réinitialisation
  showResetSuccess(): void {
    this.notifier.showSuccess(this.messages.reset.success);
  }

  showResetError(): void {
    this.notifier.showError(this.messages.reset.error);
  }

  // Méthodes génériques
  showCustomSuccess(message: string, config?: ToastConfig): void {
    this.notifier.showSuccess(message, config);
  }

  showCustomError(message: string, config?: ToastConfig): void {
    this.notifier.showError(message, config);
  }

  showCustomWarning(message: string, config?: ToastConfig): void {
    this.notifier.showWarning(message, config);
  }

  showCustomInfo(message: string, config?: ToastConfig): void {
    this.notifier.showInfo(message, config);
  }

  dismiss(toastId?: string): void {
    this.notifier.dismiss(toastId);
  }
}

// ================================
// 8. FACTORY ET INSTANCE GLOBALE
// ================================

export const createToastNotifier = (type: 'react-hot-toast' = 'react-hot-toast'): IToastNotifier => {
  switch (type) {
    case 'react-hot-toast':
      return new ReactHotToastNotifier();
    default:
      return new ReactHotToastNotifier();
  }
};

// Instance globale pour les formulaires
export const globalFormToastNotifier = new FormToastNotifier(createToastNotifier());

// ================================
// 9. HOOK PERSONNALISÉ
// ================================

export const useFormToast = (customMessages?: Partial<FormToastMessages>) => {
  const [notifier] = useState(() => {
    const baseNotifier = createToastNotifier();
    const messages = customMessages ? { ...FORM_TOAST_MESSAGES, ...customMessages } : FORM_TOAST_MESSAGES;
    return new FormToastNotifier(baseNotifier, messages);
  });

  return notifier;
};

// ================================
// 10. UTILITAIRES POUR LA MIGRATION
// ================================

export const FormToastUtils = {
  // Validation helpers
  handleValidationError: (
    isValid: boolean,
    touched: boolean,
    allRequiredFieldsFilled: boolean,
    notifier: FormToastNotifier
  ): boolean => {
    if (!isValid) {
      notifier.showValidationError('invalidFields');
      return false;
    }
    
    if (!touched) {
      notifier.showValidationError('incompleteFields');
      return false;
    }
    
    if (!allRequiredFieldsFilled) {
      notifier.showValidationError('requiredFieldsMissing');
      return false;
    }
    
    return true;
  },

  // Navigation helper
  handleNavigationSuccess: (
    requiredCount: number,
    totalCount: number,
    notifier: FormToastNotifier
  ): void => {
    notifier.showNavigationSuccess(requiredCount, totalCount);
  },

  // Submission helper
  handleSubmissionSuccess: (
    requiredCount: number,
    notifier: FormToastNotifier
  ): void => {
    notifier.showSubmissionSuccess(requiredCount);
  },

  // Reset helper
  handleResetSuccess: (notifier: FormToastNotifier): void => {
    notifier.showResetSuccess();
  },

  handleResetError: (notifier: FormToastNotifier): void => {
    notifier.showResetError();
  }
};

// ================================
// 11. EXEMPLE D'UTILISATION
// ================================

/*
// Dans votre composant FormEngine

import { useFormToast, FormToastUtils } from './toasts/FormToastNotifier';

const FormEngine = () => {
  const toastNotifier = useFormToast();

  const handleNext = async () => {
    setIsValidating(true);
    try {
      const { isValid, touched, allRequiredFieldsFilled, requiredFieldsCount, visibleFieldsCount } = await validatePage();
      
      // Utilisation des utilitaires
      const isValidationPassed = FormToastUtils.handleValidationError(
        isValid, 
        touched, 
        allRequiredFieldsFilled, 
        toastNotifier
      );
      
      if (!isValidationPassed) return;
      
      navigation.goToNext();
      FormToastUtils.handleNavigationSuccess(requiredFieldsCount, visibleFieldsCount, toastNotifier);
    } finally {
      setIsValidating(false);
    }
  };

  const handleClearAll = () => {
    try {
      // Logique de suppression...
      FormToastUtils.handleResetSuccess(toastNotifier);
    } catch (error) {
      FormToastUtils.handleResetError(toastNotifier);
    }
  };
};
*/