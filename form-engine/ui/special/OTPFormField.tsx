import React, { useState, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { FormFieldWrapper, getLocalizedText } from "../../FormFieldWrapper";
import type { FormField } from "../../types/formTypeStructure";
import { SpecialField } from "../../types/formTypeStructure";

interface OTPFormField extends FormField {
  fieldType: SpecialField.OTP;
}

interface OTPFormFieldProps {
  field: OTPFormField;
  name?: string;
  currentLang?: string;
  defaultValue?: string;
  className?: string;
  onOTPComplete?: (otpCode: string) => void; // 🆕 Callback quand le code est complet
}

const OTPFormField: React.FC<OTPFormFieldProps> = ({
  field,
  name,
  currentLang = "fr",
  className,
  defaultValue = "",
  onOTPComplete, // 🆕
}) => {
  const { setValue, watch } = useFormContext();
  const fieldName = name ?? field.fieldName.toString();
  const otpLength = field.otpFormFieldExecOptions?.otpLength ?? 6;
  
  // État local pour les cases OTP
  const [otpValues, setOtpValues] = useState<string[]>(
    Array(otpLength).fill("")
  );
  
  // Références pour les inputs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Synchroniser avec react-hook-form
  const currentValue = watch(fieldName);
  useEffect(() => {
    if (currentValue && typeof currentValue === "string" && currentValue.length === otpLength) {
      const values = currentValue.split("").slice(0, otpLength);
      setOtpValues(values);
    } else if (defaultValue && defaultValue.length === otpLength) {
      const values = defaultValue.split("").slice(0, otpLength);
      setOtpValues(values);
    }
  }, [currentValue, defaultValue, otpLength]);

  // Mettre à jour RHF quand les valeurs changent
  useEffect(() => {
    const otpString = otpValues.join("");
    if (otpString.length === otpLength) {
      setValue(fieldName, otpString, {
        shouldValidate: true,
        shouldTouch: true,
      });
    } else {
      setValue(fieldName, otpString, {
        shouldValidate: false,
        shouldTouch: true,
      });
    }
  }, [otpValues, fieldName, setValue, otpLength]);

  // 🆕 Détecter quand le code OTP est complet et déclencher l'auto-validation
  useEffect(() => {
    const otpString = otpValues.join("");
    if (otpString.length === otpLength && onOTPComplete) {
      // Délai court pour laisser le temps à RHF de se mettre à jour
      const timer = setTimeout(() => {
        onOTPComplete(otpString);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [otpValues, otpLength, onOTPComplete]);

  const handleChange = (index: number, value: string) => {
    // Ne permettre que les chiffres
    const numericValue = value.replace(/\D/g, "");
    
    if (numericValue.length > 1) {
      // Si plusieurs caractères, prendre le dernier
      const lastChar = numericValue.slice(-1);
      updateOTPValue(index, lastChar);
    } else if (numericValue.length === 1) {
      updateOTPValue(index, numericValue);
    } else {
      updateOTPValue(index, "");
    }
  };

  const updateOTPValue = (index: number, value: string) => {
    const newValues = [...otpValues];
    newValues[index] = value;
    setOtpValues(newValues);

    // Auto-avancement vers la case suivante
    if (value && index < otpLength - 1) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 10);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Navigation avec les flèches
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < otpLength - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
    
    // Backspace : effacer et revenir en arrière
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    
    // Delete : effacer la case courante
    if (e.key === "Delete") {
      updateOTPValue(index, "");
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");
    const values = pastedData.slice(0, otpLength).split("");
    
    const newValues = [...otpValues];
    values.forEach((char, i) => {
      if (i < otpLength) {
        newValues[i] = char;
      }
    });
    
    setOtpValues(newValues);
    
    // Focus sur la dernière case remplie ou la première vide
    const lastFilledIndex = Math.min(values.length - 1, otpLength - 1);
    setTimeout(() => {
      inputRefs.current[lastFilledIndex]?.focus();
    }, 10);
  };

  return (
    <FormFieldWrapper field={field} currentLang={currentLang}>
      <div className={`flex gap-2 justify-center ${className || ""}`}>
        {otpValues.map((value, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className="w-12 h-12 text-center text-2xl font-bold border-2 border-teal-500 rounded-lg text-teal-700 focus:border-teal-600 focus:ring-2 focus:ring-teal-200 outline-none transition-all bg-white"
            autoFocus={index === 0 && !otpValues.some(v => v)}
          />
        ))}
      </div>
    </FormFieldWrapper>
  );
};

export default OTPFormField;

