import React, { useState, useEffect } from "react";
import { FormFieldWrapper, getLocalizedText } from "../FormFieldWrapper";
import { Input } from "../components/ui/input";
import type { FormField } from "../types/formTypeStructure";
import { useFormContext } from "react-hook-form";

interface NumberFormField extends FormField {
  fieldType: "number";
}

interface NumberFormFieldProps {
  field: NumberFormField;
  name?: string;
  defaultValue?: string | number;
  currentLang?: string;
  className?: string;
}

const NumberFormField: React.FC<NumberFormFieldProps> = ({
  field,
  name,
  defaultValue,
  currentLang = "fr",
  className,
}) => {
  const { setValue, watch } = useFormContext();
  const placeholder = getLocalizedText(field.placeholder, currentLang);
  const fieldName = name ?? field.fieldName.toString();

  const [displayValue, setDisplayValue] = useState<string>("");

  const formatNumber = (value: number | string): string => {
    if (value === null || value === undefined || value === "") return "";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return "";
    return numValue.toLocaleString("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const parseFormattedValue = (formattedValue: string): number => {
    if (!formattedValue) return 0;
    return parseFloat(formattedValue.replace(/\s/g, "")) || 0;
  };

  useEffect(() => {
    if (defaultValue != null && !isNaN(Number(defaultValue))) {
      setDisplayValue(formatNumber(Number(defaultValue)));
    }
  }, [defaultValue]);

  const currentValue = watch(fieldName);
  useEffect(() => {
    if (currentValue !== undefined && currentValue !== null && !isNaN(Number(currentValue))) {
      const formatted = formatNumber(Number(currentValue));
      if (formatted !== displayValue) setDisplayValue(formatted);
    }
  }, [currentValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (!/^[\d\s,]*$/.test(inputValue)) return;
    setDisplayValue(inputValue);
    setValue(fieldName, parseFormattedValue(inputValue), {
      shouldValidate: true,
      shouldTouch: true,
    });
  };

  const handleBlur = () => {
    const numericValue = parseFormattedValue(displayValue);
    if (!isNaN(numericValue)) setDisplayValue(formatNumber(numericValue));
  };

  return (
    <FormFieldWrapper field={field} currentLang={currentLang}>
      <Input
        type="text"
        name={fieldName}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className={className}
      />
    </FormFieldWrapper>
  );
};

export default NumberFormField;
