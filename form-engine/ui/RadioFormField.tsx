import React from "react";
import { FormFieldWrapper, getLocalizedText } from "../FormFieldWrapper";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import type { FormField } from "../types/formTypeStructure";
import { useFormContext } from "react-hook-form";

interface RadioFormField extends FormField {
  fieldType: "radio";
}

interface RadioFormFieldProps {
  field: RadioFormField;
  name?: string;
  defaultValue?: string;
  currentLang?: string;
  className?: string;
}

const RadioFormField: React.FC<RadioFormFieldProps> = ({
  field,
  name,
  defaultValue,
  currentLang = "fr",
  className,
}) => {
  const { setValue, trigger, watch } = useFormContext();
  const fieldName = name ?? field.fieldName.toString();
  const currentValue = watch(fieldName) ?? defaultValue ?? "";

  const handleValueChange = async (newValue: string) => {
    setValue(fieldName, newValue, {
      shouldValidate: true,
      shouldTouch: true,
      shouldDirty: true,
    });
    await trigger(fieldName);
    setTimeout(() => trigger(), 0);
  };

  return (
    <FormFieldWrapper field={field} currentLang={currentLang}>
      <RadioGroup
        value={currentValue}
        onValueChange={handleValueChange}
        className={`flex flex-col gap-2 ${className || ""}`}
      >
        {field.selectOptions?.map((option, idx) => {
          const inputId = `${field.formFieldId}-${option.value}-${idx}`;
          return (
            <div
              key={option.value}
              className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-teal-50 transition-all"
            >
              <RadioGroupItem value={option.value} id={inputId} />
              <Label htmlFor={inputId} className="cursor-pointer text-slate-700 flex items-center gap-1">
                {option.icon && <span>{option.icon}</span>}
                {getLocalizedText(option.label, currentLang)}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </FormFieldWrapper>
  );
};

export default RadioFormField;
