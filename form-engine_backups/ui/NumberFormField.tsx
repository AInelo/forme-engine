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
  const size = useResponsiveSize();
  const { setValue, watch } = useFormContext();
  const placeholder = getLocalizedText(field.placeholder, currentLang);
  const fieldName = name ?? field.fieldName.toString();
  
  // État local pour gérer l'affichage formaté
  const [displayValue, setDisplayValue] = useState<string>("");

  // Fonction pour formater le nombre avec des espaces de séparation des milliers
  const formatNumber = (value: number | string): string => {
    if (value === null || value === undefined || value === "") return "";
    
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return "";
    
    return numValue.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  // Fonction pour nettoyer la valeur formatée et retourner un nombre
  const parseFormattedValue = (formattedValue: string): number => {
    if (!formattedValue) return 0;
    // Supprime tous les espaces et convertit en nombre
    const cleanValue = formattedValue.replace(/\s/g, '');
    return parseFloat(cleanValue) || 0;
  };

  // Initialiser la valeur d'affichage avec la valeur par défaut
  useEffect(() => {
    if (defaultValue != null && !isNaN(Number(defaultValue))) {
      setDisplayValue(formatNumber(Number(defaultValue)));
    }
  }, [defaultValue]);
  
  // Utiliser watch pour synchroniser avec RHF (pour les repeatGroups)
  const currentValue = watch(fieldName);
  useEffect(() => {
    if (currentValue !== undefined && currentValue !== null && !isNaN(Number(currentValue))) {
      const formatted = formatNumber(Number(currentValue));
      if (formatted !== displayValue) {
        setDisplayValue(formatted);
      }
    }
  }, [currentValue, displayValue, fieldName, formatNumber]);

  const inputStyles = {
    width: `${size.width}px`,
    height: `${size.height}px`,
    borderRadius: `${size.borderRadius}px`,
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Permet seulement les chiffres, espaces et virgules
    if (!/^[\d\s,]*$/.test(inputValue)) return;
    
    // Met à jour l'affichage
    setDisplayValue(inputValue);
    
    // Parse la valeur formatée pour obtenir le nombre
    const numericValue = parseFormattedValue(inputValue);
    
    // Met à jour le formulaire RHF
    setValue(fieldName, numericValue, {
      shouldValidate: true,
      shouldTouch: true,
    });
  };

  const handleBlur = () => {
    // Au moment de quitter le champ, reformate la valeur
    const numericValue = parseFormattedValue(displayValue);
    if (!isNaN(numericValue)) {
      setDisplayValue(formatNumber(numericValue));
    }
  };

  return (
    <FormFieldWrapper field={field} currentLang={currentLang}>
      <input
        type="text" // Changé de "number" à "text" pour permettre le formatage
        name={fieldName}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className={ClassNames(baseClasses, className)}
        style={{
          ...inputStyles,
          border: "1.5px solid #008080",
          color: "#008080",
          outlineColor: "#008080",
          boxShadow: "0 1px 4px rgba(0,128,128,0.08)",
          padding: "8px 12px",
          fontSize: "1rem",
          transition: "border-color 0.2s",
        }}
      />
    </FormFieldWrapper>
  );
};

export default NumberFormField;