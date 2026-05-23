import React, { useState, useEffect } from "react";
import ClassNames from "classnames";
import { baseClasses } from "../constants/FieldDesignWrapper";

import {
  FormFieldWrapper,
  useResponsiveSize,
  getLocalizedText,
} from "../FormFieldWrapper";
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

  const size = useResponsiveSize();
  const placeholder = getLocalizedText(field.placeholder, currentLang);

  const inputStyles = {
    width: `${size.width}px`,
    height: `${size.height * 2}px`, // Double hauteur pour textarea
    borderRadius: `${size.borderRadius}px`,
  };

  const fieldName = name ?? field.fieldName.toString();
  
  // État local pour gérer la valeur affichée
  const [displayValue, setDisplayValue] = useState<string>(defaultValue || "");
  
  // Mettre à jour la valeur affichée quand defaultValue change (pour les repeatGroups)
  useEffect(() => {
    if (defaultValue !== undefined) {
      setDisplayValue(defaultValue);
    }
  }, [defaultValue]);
  
  // Utiliser watch pour synchroniser avec RHF
  const currentValue = watch(fieldName);
  useEffect(() => {
    if (currentValue !== undefined && currentValue !== displayValue) {
      setDisplayValue(currentValue);
    }
  }, [currentValue, displayValue]);

  // Handler onChange personnalisé
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);
    setValue(fieldName, newValue, {
      shouldValidate: true,
      shouldTouch: true,
    });
  };

  return (
    <FormFieldWrapper field={field} currentLang={currentLang}>
      <textarea
        name={fieldName}
        value={displayValue}
        placeholder={placeholder}
        onChange={handleChange}
        className={ClassNames(baseClasses, className)}
        style={{
          ...inputStyles,
          resize: "vertical",
          border: "2px solid #008080",
          outlineColor: "#008080",
          color: "#008080",
          padding: "10px",
          fontSize: "1rem",
          backgroundColor: "#f8ffff",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
      />
    </FormFieldWrapper>
  );
};

export default TextareaFormField;

























































// import React from "react";
// import ClassNames from "classnames";
// import {baseClasses} from "../constants/FieldDesignWrapper";

// import { 
//     FormFieldWrapper,
//     useResponsiveSize, 
//     getLocalizedText, 
//     // getCurrentValue, 
//     // baseClasses 
// } from "../FormFieldWrapper";
// import type { FormField } from "../types/formTypeStructure";
// import { useFormContext } from "react-hook-form";


// interface TextareaFormField extends FormField {
//     fieldType: "textarea";
// }

// interface TextareaFormFieldProps {
//     field: TextareaFormField;
//     name?: string; // Ajout pour permettre la personnalisation du nom du champ
//     currentLang?: string;
//     defaultValue?: string;
//     className?: string;
// }
// const TextareaFormField: React.FC<TextareaFormFieldProps> = ({
//     field,
//     name,
//     defaultValue,
//     currentLang = 'fr',
//     className

// }) => {

//     const { register } = useFormContext();

//     const size = useResponsiveSize();
//     const placeholder = getLocalizedText(field.placeholder, currentLang);

//     const inputStyles = {
//         width: `${size.width}px`,
//         height: `${size.height * 2}px`, // Double hauteur pour textarea
//         borderRadius: `${size.borderRadius}px`,
//     };

//         return (
//             <FormFieldWrapper field={field} currentLang={currentLang}>
//                 <textarea
//                     // {...register(name ?? field.formFieldId.toString())} // ✅ ICI
//                     {...register(name ?? field.fieldName.toString())} // ✅ ICI
//                 defaultValue={defaultValue} // ✅ ICI

//                     placeholder={placeholder}
//                     className={ClassNames(baseClasses, className)}
//                     style={{
//                         ...inputStyles,
//                         resize: 'vertical',
//                         border: '2px solid #008080',
//                         outlineColor: '#008080',
//                         color: '#008080',
//                         padding: '10px',
//                         fontSize: '1rem',
//                         backgroundColor: '#f8ffff',
//                         transition: 'border-color 0.2s, box-shadow 0.2s',
//                     }}
//                 />
//             </FormFieldWrapper>
//         );
//     };

// export default TextareaFormField;