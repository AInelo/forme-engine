import React from "react";
import { FormFieldWrapper, getLocalizedText } from "../FormFieldWrapper";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import type { FormField, SelectOption } from "../types/formTypeStructure";
import { useFormContext } from "react-hook-form";

interface CheckboxFormField extends FormField {
  fieldType: "checkbox";
  selectOptions: SelectOption[];
}

interface CheckboxFormFieldProps {
  field: CheckboxFormField;
  name?: string;
  currentLang?: string;
  defaultValue?: string | string[];
  className?: string;
}

const CheckboxFormField: React.FC<CheckboxFormFieldProps> = ({
  field,
  name,
  currentLang = "fr",
  className,
}) => {
  const { watch, setValue } = useFormContext();
  const fieldName = name ?? field.fieldName.toString();
  const selectedValues: string[] = watch(fieldName) || [];

  const toggleValue = (optionValue: string, checked: boolean) => {
    const newValues = checked
      ? [...selectedValues, optionValue]
      : selectedValues.filter((v) => v !== optionValue);
    setValue(fieldName, newValues, { shouldValidate: true, shouldTouch: true });
  };

  return (
    <FormFieldWrapper field={field} currentLang={currentLang}>
      <div className={`flex flex-col gap-2 ${className || ""}`}>
        {field.selectOptions?.map((option, idx) => {
          const inputId = `${fieldName}-${option.value}-${idx}`;
          const isChecked = selectedValues.includes(option.value);

          return (
            <div
              key={option.value}
              className="flex items-center gap-2 rounded px-2 py-1 hover:bg-teal-50 transition-colors"
            >
              <Checkbox
                id={inputId}
                checked={isChecked}
                onCheckedChange={(checked) => toggleValue(option.value, !!checked)}
              />
              <Label htmlFor={inputId} className="cursor-pointer font-medium text-slate-700">
                {getLocalizedText(option.label, currentLang)}
              </Label>
            </div>
          );
        })}
      </div>
    </FormFieldWrapper>
  );
};

export default CheckboxFormField;
