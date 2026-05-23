import React, { useState, useEffect } from "react";
import { FormFieldWrapper, getLocalizedText } from "../FormFieldWrapper";
import { Textarea } from "../components/ui/textarea";
import type { FormField } from "../types/formTypeStructure";
import { useFormContext } from "react-hook-form";

interface TextareaFormField extends FormField {
  fieldType: "textarea";
}

interface TextareaFormFieldProps {
  field: TextareaFormField;
  name?: string;
  currentLang?: string;
  defaultValue?: string;
  className?: string;
}

const TextareaFormField: React.FC<TextareaFormFieldProps> = ({
  field,
  name,
  defaultValue,
  currentLang = "fr",
  className,
}) => {
  const { setValue, watch } = useFormContext();
  const placeholder = getLocalizedText(field.placeholder, currentLang);
  const fieldName = name ?? field.fieldName.toString();

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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);
    setValue(fieldName, newValue, { shouldValidate: true, shouldTouch: true });
  };

  return (
    <FormFieldWrapper field={field} currentLang={currentLang}>
      <Textarea
        name={fieldName}
        value={displayValue}
        placeholder={placeholder}
        onChange={handleChange}
        className={className}
      />
    </FormFieldWrapper>
  );
};

export default TextareaFormField;
