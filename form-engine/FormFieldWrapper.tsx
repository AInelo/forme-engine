// components/atoms/formfield/FormFieldWrapper.tsx

import React, { useEffect, useState } from "react";
import type { ResponseInForm, FormField } from "./types/formTypeStructure";
import { useFormContext } from "react-hook-form";
import { AlertCircle, MessageCircle } from "lucide-react";
import Tooltip from "./components/Tooltip";

// === Breakpoints définis dans Tailwind
export const BREAKPOINTS = {
  'mobile-s': 320,
  'mobile-m': 375,
  'mobile-l': 425,
  tablet: 768,
  laptop: 1024,
  'laptop-l': 1440,
  desktop: 1920,
  '4k-screen': 2560,
};

// === Hook pour la taille responsive
export const useResponsiveSize = () => {
  const calculateSize = (screenWidth: number) => {
    let width: number;
    let height: number;

    if (screenWidth <= BREAKPOINTS['mobile-s']) width = 210;
    else if (screenWidth <= BREAKPOINTS['mobile-m']) width = 260;
    else if (screenWidth <= BREAKPOINTS['mobile-l']) width = 280;
    else if (screenWidth <= BREAKPOINTS.tablet) width = 300;
    else if (screenWidth <= BREAKPOINTS.laptop) width = 300;
    else if (screenWidth <= BREAKPOINTS['laptop-l']) width = 380;
    else if (screenWidth <= BREAKPOINTS.desktop) width = 420;
    else if (screenWidth <= BREAKPOINTS['4k-screen']) width = 420;
    else width = 500;

    const heightMobileS = 35;
    const heightKScreen = 65;
    const heightSlope = (heightKScreen - heightMobileS) / (BREAKPOINTS['4k-screen'] - BREAKPOINTS['mobile-s']);
    
    height = heightSlope * (screenWidth - BREAKPOINTS['mobile-s']) + heightMobileS;
    height = Math.max(heightMobileS, Math.min(heightKScreen, height));

    const radiusRatio = 0.25;
    const borderRadius = Math.round(height * radiusRatio);
    const finalBorderRadius = Math.max(8, Math.min(16, borderRadius));

    return {
      width: Math.round(width),
      height: Math.round(height),
      borderRadius: finalBorderRadius,
    };
  };

  const [size, setSize] = useState(() =>
    typeof window !== "undefined"
      ? calculateSize(window.innerWidth)
      : { width: 340, height: 48, borderRadius: 12 }
  );

  useEffect(() => {
    const updateSize = () => {
      setSize(calculateSize(window.innerWidth));
    };

    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateSize, 100);
    };

    updateSize();
    window.addEventListener("resize", debouncedResize);
    return () => {
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return size;
};

// === Hook pour breakpoint actuel
export const useCurrentBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<keyof typeof BREAKPOINTS | 'xs'>('tablet');

  useEffect(() => {
    const update = () => {
      const screenWidth = window.innerWidth;
      if (screenWidth < BREAKPOINTS['mobile-s']) setBreakpoint('xs');
      else if (screenWidth < BREAKPOINTS['mobile-m']) setBreakpoint('mobile-s');
      else if (screenWidth < BREAKPOINTS['mobile-l']) setBreakpoint('mobile-m');
      else if (screenWidth < BREAKPOINTS.tablet) setBreakpoint('mobile-l');
      else if (screenWidth < BREAKPOINTS.laptop) setBreakpoint('tablet');
      else if (screenWidth < BREAKPOINTS['laptop-l']) setBreakpoint('laptop');
      else if (screenWidth < BREAKPOINTS.desktop) setBreakpoint('laptop-l');
      else if (screenWidth < BREAKPOINTS['4k-screen']) setBreakpoint('desktop');
      else setBreakpoint('4k-screen');
    };

    let timeoutId: NodeJS.Timeout;
    const debounced = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(update, 100);
    };

    update();
    window.addEventListener("resize", debounced);
    return () => {
      window.removeEventListener("resize", debounced);
      clearTimeout(timeoutId);
    };
  }, []);

  return breakpoint;
};

// === Multilingue
export const getLocalizedText = (
  text: string | { [lang: string]: string } | undefined,
  currentLang: string = "fr"
): string => {
  if (!text) return "";
  if (typeof text === "string") return text;
  return text[currentLang] || text["fr"] || text["en"] || Object.values(text)[0] || "";
};

// === Extraire la valeur actuelle d'un champ
export const getCurrentValue = (responses: ResponseInForm | ResponseInForm[]): any => {
  if (Array.isArray(responses)) return responses.map(r => r.responseValue);
  return responses.responseValue;
};

// === Fonction pour extraire les messages d'erreur
export const extractErrorMessages = (err: any): string[] => {
  if (!err) return [];

  // Si c'est un array d'erreurs
  if (Array.isArray(err)) {
    return err.flatMap(e => extractErrorMessages(e)).filter(Boolean);
  }

  // Si c'est un objet avec une propriété message
  if (typeof err === "object" && err !== null) {
    if (typeof err.message === "string" && err.message.trim()) {
      return [err.message];
    }
    // Cas où l'erreur pourrait être dans une autre propriété
    if (err.type && typeof err.type === "string") {
      return [err.type];
    }
  }

  // Si c'est directement une string
  if (typeof err === "string" && err.trim()) {
    return [err];
  }

  return [];
};


// === Wrapper générique pour tout champ
export const FormFieldWrapper: React.FC<{
  field: FormField;
  currentLang?: string;
  showLabel?: boolean;
  children: React.ReactNode;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ field, currentLang = "fr", showLabel = true, children, tooltipPosition = 'right' }) => {


  const isRequired = field.validations?.some(v => v.validationType === "required");
  const { formState, getFieldState } = useFormContext();

  // Fonction pour accéder aux erreurs imbriquées
  function getByPath(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((acc, part) => {
      if (!acc) return undefined;
      if (Array.isArray(acc)) return acc[Number(part)];
      return acc[part];
    }, obj);
  }


    const fieldName = field.fieldName?.toString() ?? "";
  const error = getByPath(formState.errors, fieldName);
  const fieldState = getFieldState(fieldName, formState);

  const errorMessages = extractErrorMessages(error);

  // Logique d'affichage des erreurs
  const showError = errorMessages.length > 0 && (
    // Afficher l'erreur si le champ a été touché ET qu'il y a une erreur
    (fieldState.isTouched && fieldState.invalid) ||
    // Ou si le formulaire a été soumis
    formState.isSubmitted ||
    // Ou si on a tenté de soumettre
    formState.submitCount > 0
  );

  // Récupération du texte de tooltip localisé
  const tooltipText = getLocalizedText(field.tooltip, currentLang);

  return (
    <div className="mb-4">
      {showLabel && (
        <div className="flex items-center mb-2">

          {(tooltipText || field.helpText) && (
            <Tooltip
              tooltipContent={tooltipText}
              helpTextContent={
                field.helpText
                  ? getLocalizedText(field.helpText, currentLang)
                  : ""
              }
              position={tooltipPosition}
              className="ml-2"
            >
              <MessageCircle
                size={16}
                className="text-gray-400 hover:text-gray-600 cursor-help transition-colors duration-200"
                tabIndex={0}
                aria-label="Information supplémentaire"
              />
            </Tooltip>
          )}

          <label className="block text-sm font-medium text-gray-700">
            {getLocalizedText(field.label, currentLang)}
            {isRequired && (
              <AlertCircle size={12} className="inline text-red-500 ml-1" />
            )}
          </label>

          {/* Tooltip à côté du label */}

        </div>
      )}

      {children}

  
      {/* Affichage des erreurs */}
      {showError && errorMessages.map((msg, idx) => (
        <p key={idx} className="text-sm text-red-500 mt-1">
          {typeof msg === 'string' && msg.trim() ? msg : 'Champ invalide'}
        </p>
      ))}

      {field.example && (
        <p className="text-sm text-gray-300 mt-1 font-light italic">
          Exemple: {getLocalizedText(field.example, currentLang)}
        </p>
      )}
    </div>
  );
};

export default FormFieldWrapper;
