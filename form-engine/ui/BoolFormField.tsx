import React from "react";
import {
  getLocalizedText,
  FormFieldWrapper,
} from "../FormFieldWrapper";
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
  defaultValue,
  currentLang = "fr",
  className = "",
}) => {
  const { register, setValue, watch } = useFormContext();

  const fieldName = name ?? field.fieldName.toString();
  const label = getLocalizedText(field.label, currentLang);
  const isRequired = field.validations?.some(v => v.validationType === "required");

  const currentValue = Boolean(watch(fieldName));

  // 👇 Important : pour récupérer onChange RHF
  const { onChange: fieldOnChange, ...rest } = register(fieldName);

  return (
    <FormFieldWrapper field={field} currentLang={currentLang} showLabel={false}>
      <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
        <input
          type="checkbox"
          {...rest} // le reste des props de register
          checked={currentValue}
          onChange={(e) => {
            fieldOnChange(e); // RHF update
            setValue(fieldName, e.target.checked, {
              shouldValidate: true,
              shouldTouch: true,
            });
          }}
          className="accent-[#008080] focus:ring-2 focus:ring-[#008080] border-[#008080] w-5 h-5"
        />
        <span className="text-[#008080] font-medium">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </span>
      </label>
    </FormFieldWrapper>
  );
};

export default BoolFormField;