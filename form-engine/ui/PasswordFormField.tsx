import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FormFieldWrapper, getLocalizedText } from "../FormFieldWrapper";
import { Input } from "../components/ui/input";
import type { FormField } from "../types/formTypeStructure";
import { useFormContext } from "react-hook-form";

interface PasswordFormField extends FormField {
  fieldType: "password";
}

interface PasswordFormFieldProps {
  field: PasswordFormField;
  name?: string;
  currentLang?: string;
  defaultValue?: string;
  className?: string;
}

const PasswordFormField: React.FC<PasswordFormFieldProps> = ({
  field,
  name,
  defaultValue,
  currentLang = "fr",
  className,
}) => {
  const { setValue, watch } = useFormContext();
  const [showPassword, setShowPassword] = useState(false);
  const placeholder = getLocalizedText(field.placeholder, currentLang);
  const fieldName = name ?? field.fieldName.toString();

  const currentValue = watch(fieldName) ?? defaultValue ?? "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(fieldName, e.target.value, { shouldValidate: true, shouldTouch: true });
  };

  return (
    <FormFieldWrapper field={field} currentLang={currentLang}>
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          name={fieldName}
          value={currentValue}
          placeholder={placeholder}
          onChange={handleChange}
          className={className}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </FormFieldWrapper>
  );
};

export default PasswordFormField;
