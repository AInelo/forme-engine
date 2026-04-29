import React from "react";
import { 
    FormFieldWrapper,
    getLocalizedText, 
} from "../FormFieldWrapper";
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
    defaultValue,
    currentLang = 'fr',
    className
}) => {
    const { register, watch, setValue } = useFormContext();

    const fieldName = name ?? field.fieldName.toString();
    const selectedValues: string[] = watch(fieldName) || [];

    // ✅ on récupère l'objet de register pour avoir onChange
    const { onChange: fieldOnChange, ...rest } = register(fieldName);

    const toggleValue = (optionValue: string, checked: boolean) => {
        const newValues = checked
            ? [...selectedValues, optionValue]
            : selectedValues.filter((v) => v !== optionValue);

        // RHF + mise à jour manuelle
        setValue(fieldName, newValues, {
            shouldValidate: true,
            shouldTouch: true,
        });

        fieldOnChange({ target: { value: newValues } }); // Important pour RHF internals
    };

    return (
        <FormFieldWrapper field={field} currentLang={currentLang}>
            <div className={`flex flex-col gap-2 ${className || ''}`}>
                {field.selectOptions?.map((option, idx) => {
                    const inputId = `${fieldName}-${option.value}-${idx}`;
                    const isChecked = selectedValues.includes(option.value);

                    return (
                        <label
                            key={option.value}
                            htmlFor={inputId}
                            className="flex items-center gap-2 cursor-pointer transition-colors hover:bg-[#e0f7f7] rounded px-2 py-1"
                            style={{ color: '#008080' }}
                        >
                            <input
                                type="checkbox"
                                id={inputId}
                                value={option.value}
                                checked={isChecked}
                                {...rest}
                                onChange={(e) => {
                                    toggleValue(option.value, e.target.checked);
                                }}
                                className="accent-[#008080] w-4 h-4 focus:ring-2 focus:ring-[#008080] border-[#008080]"
                            />
                            <span className="font-medium" style={{ color: '#008080' }}>
                                {getLocalizedText(option.label, currentLang)}
                            </span>
                        </label>
                    );
                })}
            </div>
        </FormFieldWrapper>
    );
};

export default CheckboxFormField;







































// // components/atoms/formfield/ui/CheckboxFormField.tsx

// import React from "react";
// import { 
//     FormFieldWrapper,
//     getLocalizedText, 
//     // baseClasses 
// } from "../FormFieldWrapper";
// import type { FormField, SelectOption } from "../types/formTypeStructure";
// import { useFormContext } from "react-hook-form";
// // import { type AllowedFormValue } from "../types/formUtils";


// interface CheckboxFormField extends FormField {
//     fieldType: "checkbox";
//     selectOptions: SelectOption[];
// }

// interface CheckboxFormFieldProps {
//     field: CheckboxFormField;
//     name?: string; 
//     currentLang?: string;
//     defaultValue?:string | string[]; // Permet de définir une valeur par défaut
//     className?: string;
// }

// const CheckboxFormField: React.FC<CheckboxFormFieldProps> = ({
//     field,
//     name,
//     defaultValue,
//     currentLang = 'fr',
//     className
// }) => {
//     const { register, watch } = useFormContext();

//     const fieldName =  name ?? field.fieldName.toString();


//     // On "observe" la valeur pour cocher les cases
//     const selectedValues: string[] = watch(fieldName) || [];

//     return (
//         <FormFieldWrapper field={field} currentLang={currentLang}>
//             <div className={`flex flex-col gap-2 ${className || ''}`}>
//                 {field.selectOptions?.map((option, idx) => {
//                     const inputId = `${fieldName}-${option.value}-${idx}`;
//                     return (
//                         <label
//                             key={option.value}
//                             htmlFor={inputId}
//                             className="flex items-center gap-2 cursor-pointer transition-colors hover:bg-[#e0f7f7] rounded px-2 py-1"
//                             style={{ color: '#008080' }}
//                         >
//                             <input
//                                 type="checkbox"
//                                 id={inputId}
//                                 value={option.value}
//                                 {...register(fieldName)}
//                                 defaultValue={defaultValue} // ✅ ICI
//                                 checked={selectedValues.includes(option.value)}
//                                 className="accent-[#008080] w-4 h-4 focus:ring-2 focus:ring-[#008080] border-[#008080]"
//                             />
//                             <span className="font-medium" style={{ color: '#008080' }}>
//                                 {getLocalizedText(option.label, currentLang)}
//                             </span>
//                         </label>
//                     );
//                 })}
//             </div>
//         </FormFieldWrapper>
//     );
// };

// export default CheckboxFormField;






