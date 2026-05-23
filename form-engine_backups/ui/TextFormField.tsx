import React, { useState, useEffect } from "react";
import ClassNames from "classnames";
import { baseClasses } from "../constants/FieldDesignWrapper";
import {
  FormFieldWrapper,
  useResponsiveSize,
  getLocalizedText,
} from "../FormFieldWrapper";
import type { FormField, Section } from "../types/formTypeStructure";
import { useFormContext } from "react-hook-form";
import { useEmailOTPTrigger } from "../hooks/useEmailOTPTrigger";

interface TextFormField extends FormField {
  fieldType: "text";
}

interface TextFormFieldProps {
  field: TextFormField;
  name?: string;
  currentLang?: string;
  defaultValue?: string;
  className?: string;
  allSections?: Section[];
  currentSectionIndex?: number;
}


const TextFormField: React.FC<TextFormFieldProps> = ({
  field,
  name,
  defaultValue,
  currentLang = "fr",
  className,
  allSections = [],
  currentSectionIndex = 0,
}) => {
  const { setValue, watch } = useFormContext();
  const size = useResponsiveSize();
  const placeholder = getLocalizedText(field.placeholder, currentLang);
  const fieldName = name ?? field.fieldName.toString();
  
  // Détecter si ce champ Email doit déclencher l'envoi d'OTP
  const hasEmailValidation = field.validations?.some(
    (v) => v.validationType === "email"
  );
  const shouldTriggerOTP = field.emailFormFieldExecOptions?.triggerOTPSend === true;
  
  // Utiliser le hook pour l'envoi automatique d'OTP
  // Le hook vérifie lui-même les conditions (triggerOTPSend, validation email, etc.)
  const emailOTPTrigger = useEmailOTPTrigger({
    emailField: field,
    allSections,
    currentSectionIndex,
    onOTPSent: (email) => {
      console.log(`✅ OTP envoyé automatiquement à ${email}`);
    },
  });
  
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

  // onChange personnalisé
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);
    setValue(fieldName, newValue, {
      shouldValidate: true,
      shouldTouch: true,
    });
  };

  const inputStyles = {
    width: `${size.width}px`,
    height: `${size.height}px`,
    borderRadius: `${size.borderRadius}px`,
    border: "2px solid #008080",
    color: "#008080",
    outlineColor: "#008080",
    padding: "0 12px",
    fontSize: "1rem",
    transition: "border-color 0.2s",
    background: "#fff",
  };

  return (
    <FormFieldWrapper field={field} currentLang={currentLang}>
      {/* Indicateur visuel pendant l'envoi d'OTP */}
      {hasEmailValidation && shouldTriggerOTP && emailOTPTrigger.isSendingOTP && (
        <div className="mb-2 text-sm text-blue-600 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Envoi du code OTP en cours...</span>
        </div>
      )}
      {hasEmailValidation && shouldTriggerOTP && emailOTPTrigger.otpSent && !emailOTPTrigger.isSendingOTP && (
        <div className="mb-2 text-sm text-green-600">
          ✓ Code OTP envoyé avec succès
        </div>
      )}
      {hasEmailValidation && shouldTriggerOTP && emailOTPTrigger.error && (
        <div className="mb-2 text-sm text-red-600">
          ⚠ Erreur: {emailOTPTrigger.error}
        </div>
      )}
      <input
        type="text"
        name={fieldName}
        value={displayValue}
        placeholder={placeholder}
        onChange={handleChange}
        className={ClassNames(baseClasses, className)}
        style={inputStyles}
      />
    </FormFieldWrapper>
  );
};

export default TextFormField;











































// import React from "react";
// import ClassNames from "classnames";
// import {baseClasses} from "../constants/FieldDesignWrapper";
// import { 
//     FormFieldWrapper,
//     useResponsiveSize, 
//     getLocalizedText, 
//     // baseClasses 
// } from "../FormFieldWrapper";
// import type { FormField } from "../types/formTypeStructure";
// import { useFormContext } from "react-hook-form";


// interface TextFormField extends FormField {
//     fieldType: "text";
// }

// interface TextFormFieldProps {
//     field: TextFormField;
//     name?: string; // Ajout pour permettre la personnalisation du nom du champ
//     currentLang?: string;
//     defaultValue?: string; // Ajout pour permettre la valeur par défaut
//     className?: string;
// }


// const TextFormField: React.FC<TextFormFieldProps> = ({
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
//         height: `${size.height}px`,
//         borderRadius: `${size.borderRadius}px`,
//         border: "2px solid #008080",
//         color: "#008080",
//         outlineColor: "#008080",
//         padding: "0 12px",
//         fontSize: "1rem",
//         transition: "border-color 0.2s",
//         background: "#fff",
//     };

//     return (
//         <FormFieldWrapper field={field} currentLang={currentLang}>
//             <input
//                 type="text"
//                 // {...register(name ?? field.formFieldId.toString())} // ✅ ICI
//                 {...register(name ?? field.fieldName.toString())} // ✅ ICI
//                 defaultValue={defaultValue} // ✅ ICI
//                 placeholder={placeholder}
//                 className={ClassNames(baseClasses, className)}
//                 style={inputStyles}
//             />
//         </FormFieldWrapper>
//     );
// };


// export default TextFormField;