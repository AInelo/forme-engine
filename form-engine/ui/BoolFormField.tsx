import React from "react";
import { FormFieldWrapper, getLocalizedText } from "../FormFieldWrapper";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import type { FormField } from "../types/formTypeStructure";
import { useFormContext } from "react-hook-form";

interface BoolFormField extends FormField {
  fieldType: "bool";
}

interface BoolFormFieldProps {
  field: BoolFormField;
  name?: string;
  currentLang?: string;
  defaultValue?: boolean;
  className?: string;
}

const BoolFormField: React.FC<BoolFormFieldProps> = ({
  field,
  name,
  currentLang = "fr",
  className = "",
}) => {
  const { setValue, watch } = useFormContext();
  const fieldName = name ?? field.fieldName.toString();
  const label = getLocalizedText(field.label, currentLang);
  const isRequired = field.validations?.some((v) => v.validationType === "required");
  const currentValue = Boolean(watch(fieldName));
  const switchId = `switch-${fieldName}`;

  return (
    <FormFieldWrapper field={field} currentLang={currentLang} showLabel={false}>
      <div
        className={`flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors ${
          currentValue ? "border-teal-200 bg-teal-50/30" : ""
        } ${className}`}
      >
        <Label htmlFor={switchId} className="cursor-pointer font-medium text-slate-700 flex-1 pr-4">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Switch
          id={switchId}
          checked={currentValue}
          onCheckedChange={(checked) =>
            setValue(fieldName, checked, { shouldValidate: true, shouldTouch: true })
          }
        />
      </div>
    </FormFieldWrapper>
  );
};

export default BoolFormField;
