
// // components/atoms/formfield/ui/PasswordFormField.tsx
import React from "react";
import ClassNames from "classnames";
import type { FormField } from "../types/formTypeStructure";
import { baseClasses } from "../constants/FieldDesignWrapper";

import { 
    useResponsiveSize, 
    getLocalizedText, 
    FormFieldWrapper 
} from "../FormFieldWrapper";
import { useFormContext } from "react-hook-form";

interface PasswordFormField extends FormField {
    fieldType: "password";
}

interface PasswordFormFieldProps {
    field: PasswordFormField;
    name?: string;
    currentLang?: string;
    defaultValue?: string;
    className?: string;
}

const PasswordFormField: React.FC<PasswordFormFieldProps> = ({
    field,
    name,
    defaultValue,
    currentLang = 'fr',
    className
}) => {
    const size = useResponsiveSize();
    const { register, setValue } = useFormContext();
    const placeholder = getLocalizedText(field.placeholder, currentLang);

    const inputStyles = {
        width: `${size.width}px`,
        height: `${size.height}px`,
        borderRadius: `${size.borderRadius}px`,
    };

    // On récupère la ref et l'on crée un onChange qui appelle le handler original puis setValue
    const { ref, onChange: originalOnChange, ...restRegister } = register(name ?? field.fieldName.toString());

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        originalOnChange(e);
        setValue(name ?? field.fieldName.toString(), e.target.value, {
            shouldValidate: true,
            shouldTouch: true,
        });
    };

    return (
        <FormFieldWrapper field={field} currentLang={currentLang}>
            <input
                type="password"
                placeholder={placeholder}
                {...restRegister}
                ref={ref}
                onChange={handleChange}
                defaultValue={defaultValue}
                className={ClassNames(baseClasses, className)}
                style={{
                    ...inputStyles,
                    border: '1.5px solid #008080',
                    outlineColor: '#008080',
                    color: '#008080',
                    backgroundColor: '#f7fafb',
                    transition: 'border-color 0.2s',
                }}
            />
        </FormFieldWrapper>
    );
};

export default PasswordFormField;










































// import React from "react";
// import ClassNames from "classnames";
// import type { FormField } from "../types/formTypeStructure";
// import {baseClasses} from "../constants/FieldDesignWrapper";


// import { 
//     useResponsiveSize, 
//     getLocalizedText, 
//     FormFieldWrapper 
// } from "../FormFieldWrapper";
// import { useFormContext } from "react-hook-form";

// interface PasswordFormField extends FormField {
//     fieldType: "password"
// }

// interface PasswordFormFieldProps {
//     field: PasswordFormField;
//     name?: string; // Ajout pour permettre la personnalisation du nom du champ
//     currentLang?: string;
//     defaultValue?: string;
//     className?: string;
// }

// const PasswordFormField: React.FC<PasswordFormFieldProps> = ({
//     field,
//     name,
//     defaultValue,
//     currentLang = 'fr',
//     className
// }) => {
//     const size = useResponsiveSize();
//     const { register } = useFormContext();
//     const placeholder = getLocalizedText(field.placeholder, currentLang);

//     const inputStyles = {
//         width: `${size.width}px`,
//         height: `${size.height}px`,
//         borderRadius: `${size.borderRadius}px`,
//     };

//     return (
//         <FormFieldWrapper field={field} currentLang={currentLang}>
//             <input
//                 type="password"
//                 placeholder={placeholder}
//                                 {...register(name ?? field.fieldName.toString())} // ✅ ICI

//                 // {...register(name ?? field.formFieldId.toString())} // ✅ ICI
                
//                 defaultValue={defaultValue} // ✅ ICI
//                 className={ClassNames(baseClasses, className)}
//                 style={{
//                     ...inputStyles,
//                     border: '1.5px solid #008080',
//                     outlineColor: '#008080',
//                     color: '#008080',
//                     backgroundColor: '#f7fafb',
//                     transition: 'border-color 0.2s',
//                 }}
//             />
//         </FormFieldWrapper>
//     );
// };

// export default PasswordFormField;