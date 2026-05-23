import React, { useState, useEffect } from "react";
import { FormFieldWrapper, getLocalizedText } from "../FormFieldWrapper";
import { Input } from "../components/ui/input";
import type { FormField, Section } from "../types/formTypeStructure";
import { useFormContext } from "react-hook-form";
import { useEmailOTPTrigger } from "../hooks/useEmailOTPTrigger";

interface TextFormField extends FormField {
  fieldType: "text";
}

interface TextFormFieldProps {
  field: TextFormField;
  name?: string;
  currentLang?: string;
  defaultValue?: string;
  className?: string;
  allSections?: Section[];
  currentSectionIndex?: number;
}

const TextFormField: React.FC<TextFormFieldProps> = ({
  field,
  name,
  defaultValue,
  currentLang = "fr",
  className,
  allSections = [],
  currentSectionIndex = 0,
}) => {
  const { setValue, watch } = useFormContext();
  const placeholder = getLocalizedText(field.placeholder, currentLang);
  const fieldName = name ?? field.fieldName.toString();

  const hasEmailValidation = field.validations?.some(
    (v) => v.validationType === "email"
  );
  const shouldTriggerOTP = field.emailFormFieldExecOptions?.triggerOTPSend === true;

  const emailOTPTrigger = useEmailOTPTrigger({
    emailField: field,
    allSections,
    currentSectionIndex,
    onOTPSent: (email) => {
      console.log(`✅ OTP envoyé automatiquement à ${email}`);
    },
  });

  const [displayValue, setDisplayValue] = useState<string>(defaultValue || "");

  useEffect(() => {
    if (defaultValue !== undefined) setDisplayValue(defaultValue);
  }, [defaultValue]);

  const currentValue = watch(fieldName);
  useEffect(() => {
    if (currentValue !== undefined && currentValue !== displayValue) {
      setDisplayValue(currentValue);
    }
  }, [currentValue, displayValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);
    setValue(fieldName, newValue, { shouldValidate: true, shouldTouch: true });
  };

  return (
    <FormFieldWrapper field={field} currentLang={currentLang}>
      {hasEmailValidation && shouldTriggerOTP && emailOTPTrigger.isSendingOTP && (
        <div className="mb-2 text-sm text-blue-600 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
          <span>Envoi du code OTP en cours...</span>
        </div>
      )}
      {hasEmailValidation && shouldTriggerOTP && emailOTPTrigger.otpSent && !emailOTPTrigger.isSendingOTP && (
        <div className="mb-2 text-sm text-green-600">✓ Code OTP envoyé avec succès</div>
      )}
      {hasEmailValidation && shouldTriggerOTP && emailOTPTrigger.error && (
        <div className="mb-2 text-sm text-red-600">⚠ Erreur: {emailOTPTrigger.error}</div>
      )}
      <Input
        type="text"
        name={fieldName}
        value={displayValue}
        placeholder={placeholder}
        onChange={handleChange}
        className={className}
      />
    </FormFieldWrapper>
  );
};

export default TextFormField;
