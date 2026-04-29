import React from "react";
import ClassNames from "classnames";
import type { FormField } from "../types/formTypeStructure";
import { baseClasses } from "../constants/FieldDesignWrapper";
import {
//   useResponsiveSize,
  getLocalizedText,
  FormFieldWrapper
} from "../FormFieldWrapper";
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
  className
}) => {
  const { register, setValue, trigger, watch } = useFormContext();
  const fieldName = name ?? field.fieldName.toString();
  const { ref, onChange: originalOnChange, ...restRegister } = register(fieldName);
  const currentValue = watch(fieldName);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    await originalOnChange(e);
    setValue(fieldName, newValue, {
      shouldValidate: true,
      shouldTouch: true,
      shouldDirty: true
    });
    await trigger(fieldName);
    setTimeout(() => trigger(), 0);
  };

  return (
    <FormFieldWrapper field={field} currentLang={currentLang}>
      <div className="flex flex-col gap-2">
        {field.selectOptions?.map((option, idx) => {
          const inputId = `${field.formFieldId}-${option.value}-${idx}`;
          const isChecked =
            currentValue === option.value ||
            (defaultValue === option.value && !currentValue);

          return (
            <label
              key={option.value}
              htmlFor={inputId}
              className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1 transition-all hover:bg-teal-50 active:scale-95"
            >
              <input
                type="radio"
                id={inputId}
                value={option.value}
                {...restRegister}
                ref={ref}
                onChange={handleChange}
                checked={isChecked}
                className={ClassNames(
                  baseClasses,
                  className,
                  "accent-teal-600 h-4 w-4 focus:ring-2 focus:ring-teal-400"
                )}
              />
              <span className="text-sm text-gray-800 flex items-center">
                {option.icon && <span className="mr-1">{option.icon}</span>}
                {getLocalizedText(option.label, currentLang)}
              </span>
            </label>
          );
        })}
      </div>
    </FormFieldWrapper>
  );
};

export default RadioFormField;






























































// // components/atoms/formfield/ui/RadioFormField.tsx
// import React from "react";
// import ClassNames from "classnames";
// import type { FormField } from "../types/formTypeStructure";
// import { baseClasses } from "../constants/FieldDesignWrapper";

// import {
//     useResponsiveSize,
//     getLocalizedText,
//     FormFieldWrapper
// } from "../FormFieldWrapper";
// import { useFormContext } from "react-hook-form";

// interface RadioFormField extends FormField {
//     fieldType: "radio";
// }

// interface RadioFormFieldProps {
//     field: RadioFormField;
//     name?: string;
//     defaultValue?: string;
//     currentLang?: string;
//     className?: string;
// }

// const RadioFormField: React.FC<RadioFormFieldProps> = ({
//     field,
//     name,
//     defaultValue,
//     currentLang = 'fr',
//     className
// }) => {
//     const size = useResponsiveSize();
//     const { register, setValue, trigger, watch } = useFormContext();

//     const inputStyles = {
//         width: `${size.width}px`,
//         height: `${size.height}px`,
//         borderRadius: `${size.borderRadius}px`,
//     };

//     // Préparer le nom de champ
//     const fieldName = name ?? field.fieldName.toString();

//     // Récupérer ref et onChange original du register
//     const { ref, onChange: originalOnChange, ...restRegister } = register(fieldName);

//     // Surveiller la valeur actuelle pour les conditions dynamiques
//     const currentValue = watch(fieldName);

//     // Handler personnalisé pour chaque input radio
//     const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//         const newValue = e.target.value;
        
//         // Appeler le onChange original de react-hook-form
//         await originalOnChange(e);
        
//         // Mettre à jour la valeur avec les options appropriées
//         setValue(fieldName, newValue, {
//             shouldValidate: true,
//             shouldTouch: true,
//             shouldDirty: true
//         });

//         // Déclencher la validation pour ce champ et potentiellement d'autres
//         await trigger(fieldName);
        
//         // Déclencher la validation de tous les champs pour les conditions dynamiques
//         await trigger();
        
//         // Forcer une re-render pour les conditions dynamiques
//         setTimeout(() => {
//             trigger();
//         }, 0);
//     };

//     return (
//         <FormFieldWrapper field={field} currentLang={currentLang}>
//             <div className="flex flex-col gap-2">
//                 {field.selectOptions?.map((option, idx) => {
//                     const inputId = `${field.formFieldId}-${option.value}-${idx}`;
//                     const isChecked = currentValue === option.value || 
//                                     (defaultValue === option.value && !currentValue);
                    
//                     return (
//                         <label
//                             key={option.value}
//                             htmlFor={inputId}
//                             className="flex items-center gap-2 cursor-pointer hover:bg-[#e0f7f7] rounded px-2 py-1 transition-colors"
//                         >
//                             <input
//                                 type="radio"
//                                 id={inputId}
//                                 value={option.value}
//                                 {...restRegister}
//                                 ref={ref}
//                                 onChange={handleChange}
//                                 checked={isChecked}
//                                 style={inputStyles}
//                                 className={ClassNames(
//                                     baseClasses,
//                                     className,
//                                     "accent-[#008080] focus:ring-2 focus:ring-[#008080] h-4 w-4"
//                                 )}
//                             />
//                             <span className="text-gray-800">
//                                 {option.icon && <span className="mr-1">{option.icon}</span>}
//                                 {getLocalizedText(option.label, currentLang)}
//                             </span>
//                         </label>
//                     );
//                 })}
//             </div>
//         </FormFieldWrapper>
//     );
// };

// export default RadioFormField;


































// // // components/atoms/formfield/ui/RadioFormField.tsx
// import React from "react";
// import ClassNames from "classnames";
// import type { FormField } from "../types/formTypeStructure";
// import { baseClasses } from "../constants/FieldDesignWrapper";

// import {
//     useResponsiveSize,
//     getLocalizedText,
//     FormFieldWrapper
// } from "../FormFieldWrapper";
// import { useFormContext } from "react-hook-form";

// interface RadioFormField extends FormField {
//     fieldType: "radio";
// }

// interface RadioFormFieldProps {
//     field: RadioFormField;
//     name?: string;
//     defaultValue?: string;
//     currentLang?: string;
//     className?: string;
// }

// const RadioFormField: React.FC<RadioFormFieldProps> = ({
//     field,
//     name,
//     defaultValue,
//     currentLang = 'fr',
//     className
// }) => {
//     const size = useResponsiveSize();
//     const { register, setValue } = useFormContext();

//     const inputStyles = {
//         width: `${size.width}px`,
//         height: `${size.height}px`,
//         borderRadius: `${size.borderRadius}px`,
//     };

//     // Préparer le nom de champ
//     const fieldName = name ?? field.fieldName.toString();

//     // Récupérer ref et onChange original du register
//     const { ref, onChange: originalOnChange, ...restRegister } = register(fieldName);

//     // Handler personnalisé pour chaque input radio
//     const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         originalOnChange(e);
//         setValue(fieldName, e.target.value, {
//             shouldValidate: true,
//             shouldTouch: true,
//         });
//     };

//     return (
//         <FormFieldWrapper field={field} currentLang={currentLang}>
//             <div className="flex flex-col gap-2">
//                 {field.selectOptions?.map((option, idx) => {
//                     const inputId = `${field.formFieldId}-${option.value}-${idx}`;
//                     return (
//                         <label
//                             key={option.value}
//                             htmlFor={inputId}
//                             className="flex items-center gap-2 cursor-pointer hover:bg-[#e0f7f7] rounded px-2 py-1 transition-colors"
//                         >
//                             <input
//                                 type="radio"
//                                 id={inputId}
//                                 value={option.value}
//                                 {...restRegister}
//                                 ref={ref}
//                                 onChange={handleChange}
//                                 defaultChecked={defaultValue === option.value}
//                                 style={inputStyles}
//                                 className={ClassNames(
//                                     baseClasses,
//                                     className,
//                                     "accent-[#008080] focus:ring-2 focus:ring-[#008080] h-4 w-4"
//                                 )}
//                             />
//                             <span className="text-gray-800">
//                                 {getLocalizedText(option.label, currentLang)}
//                             </span>
//                         </label>
//                     );
//                 })}
//             </div>
//         </FormFieldWrapper>
//     );
// };

// export default RadioFormField;






























































// import React from "react";
// import ClassNames from "classnames";
// import type { FormField } from "../types/formTypeStructure";
// import { baseClasses } from "../constants/FieldDesignWrapper";

// import {
//     useResponsiveSize,
//     getLocalizedText,
//     FormFieldWrapper
// } from "../FormFieldWrapper";
// import { useFormContext } from "react-hook-form";

// interface RadioFormField extends FormField {
//     fieldType: "radio";
// }

// interface RadioFormFieldProps {
//     field: RadioFormField;
//     name?: string; // Ajout pour permettre la personnalisation du nom du champ
//     defaultValue?: string;
//     currentLang?: string;
//     className?: string;
// }

// const RadioFormField: React.FC<RadioFormFieldProps> = ({
//     field,
//     name,
//     defaultValue,
//     currentLang = 'fr',
//     className
// }) => {
//     const size = useResponsiveSize();
//     const { register } = useFormContext();

//     const inputStyles = {
//         width: `${size.width}px`,
//         height: `${size.height}px`,
//         borderRadius: `${size.borderRadius}px`,
//     };

//     return (
//         <FormFieldWrapper field={field} currentLang={currentLang}>
//             <div className="flex flex-col gap-2">
//                 {field.selectOptions?.map((option, idx) => {
//                     const inputId = `${field.formFieldId}-${option.value}-${idx}`;
//                     return (
//                         <label
//                             key={option.value}
//                             htmlFor={inputId}
//                             className="flex items-center gap-2 cursor-pointer hover:bg-[#e0f7f7] rounded px-2 py-1 transition-colors"
//                         >
//                             <input
//                                 type="radio"
//                                 id={inputId}
//                                 value={option.value}
//                                 {...register(name ?? field.fieldName.toString())} // ✅ ICI

//                                 // {...register(name ?? field.formFieldId.toString())} // ✅ ICI
//                                 defaultValue={defaultValue} // ✅ ICI

//                                 style={inputStyles}
//                                 className={ClassNames(
//                                     baseClasses,
//                                     className,
//                                     "accent-[#008080] focus:ring-2 focus:ring-[#008080] h-4 w-4"
//                                 )}
//                             />
//                             <span className="text-gray-800">
//                                 {getLocalizedText(option.label, currentLang)}
//                             </span>
//                         </label>
//                     );
//                 })}
//             </div>
//         </FormFieldWrapper>
//     );
// };

// export default RadioFormField;
