
// 📁 src/types/formUtils.ts
import type { FormStructure, FormField, Section , ResponseInForm} from "./formTypeStructure";

// import { FormField, Section, ResponseInForm } from "../types/formTypeStructure";
import { shouldDisplayFormField } from "./displayRules";
/**
 * Extrait tous les champs du formulaire en aplatissant les sections.
 */
export function extractAllFields(form: FormStructure): FormField[] {
  return form.sections.flatMap((section: Section) => section.formFields ?? []);
}

/**
 * Type des valeurs autorisées dans un formulaire.
 */
export type AllowedFormValue = string | string[] | number | number[] | boolean | File | File[];

    // case "email":
    // case "phone":


export function getDefaultValueForField(field: FormField): any {
  switch (field.fieldType) {
    case "text":
    case "textarea":
    case "radio":
    case "dropdown":
    case "number":
      return "";
    case "checkbox":
      return [];
    case "date":
      return null;
    default:
      return "";
  }
}

export function prepareFormDataBeforeSubmit(
  data: Record<string, any>,
  sections: Section[]
): Record<string, any> {
  const filled = { ...data };

  const allResponseInForms: Record<string, ResponseInForm> = {};
  Object.entries(data).forEach(([key, value]) => {
    allResponseInForms[key] = { responseValue: value };
  });

  for (const section of sections) {
    for (const field of section.formFields) {
      const visible = shouldDisplayFormField(field, allResponseInForms);
      if (!visible && filled[field.fieldName] === undefined) {
        filled[field.fieldName] = getDefaultValueForField(field);
      }
    }
  }

  return filled;
}

/**
 * Vérifie si une section contient un champ OTP
 */
export function hasOTPField(section: Section): boolean {
  return section.formFields?.some(
    (field) => field.fieldType === "OTP"
  ) ?? false;
}

/**
 * Récupère le champ OTP d'une section s'il existe
 */
export function getOTPField(section: Section): FormField | undefined {
  return section.formFields?.find((field) => field.fieldType === "OTP");
}

/**
 * Aplatit les champs OTP dans le JSON final
 * Si un champ OTP a une valeur qui est un objet, ses propriétés sont aplaties au niveau racine
 */
export function flattenOTPFields(
  data: Record<string, any>,
  sections: Section[]
): Record<string, any> {
  const flattened = { ...data };

  for (const section of sections) {
    for (const field of section.formFields || []) {
      if (field.fieldType === "OTP") {
        const fieldName = field.fieldName;
        const fieldValue = flattened[fieldName];

        // Si flattenOnSubmit est explicitement false, ne pas aplatir
        if (field.flattenOnSubmit === false) {
          continue;
        }

        // Si la valeur existe et est un objet (pas null, pas array, pas primitive)
        if (
          fieldValue !== undefined &&
          fieldValue !== null &&
          typeof fieldValue === "object" &&
          !Array.isArray(fieldValue)
        ) {
          // Aplatir les propriétés de l'objet au niveau racine
          Object.entries(fieldValue).forEach(([key, value]) => {
            flattened[key] = value;
          });

          // Supprimer la clé originale du champ OTP
          delete flattened[fieldName];
        }
        // Si la valeur est une string (OTP simple), la laisser telle quelle
        // (pas besoin d'aplatir une string)
      }
    }
  }

  return flattened;
}

/**
 * Trouve l'index de la section contenant un champ donné
 */
export function findSectionIndexForField(
  fieldName: string,
  allSections: Section[]
): number {
  for (let i = 0; i < allSections.length; i++) {
    const section = allSections[i];
    const field = section.formFields?.find(
      (f) => f.fieldName === fieldName
    );
    if (field) {
      return i;
    }
  }
  return -1;
}

/**
 * Trouve le champ Email lié à un champ OTP
 * Recherche dans TOUTES les sections qui précèdent la section OTP
 */
export function findLinkedEmailField(
  otpField: FormField,
  allSections: Section[],
  otpSectionIndex: number
): FormField | undefined {
  if (!otpField.otpFormFieldExecOptions?.linkedEmailFieldName) {
    return undefined;
  }

  const emailFieldName = otpField.otpFormFieldExecOptions.linkedEmailFieldName;
  
  // Rechercher uniquement dans les sections qui précèdent la section OTP
  for (let i = 0; i < otpSectionIndex; i++) {
    const section = allSections[i];
    const emailField = section.formFields?.find(
      (field) => field.fieldName === emailFieldName
    );
    
    if (emailField) {
      // Vérifier que c'est bien un champ avec validation email
      const hasEmailValidation = emailField.validations?.some(
        (v) => v.validationType === "email"
      );
      
      if (hasEmailValidation) {
        return emailField;
      }
    }
  }
  
  return undefined;
}

/**
 * Trouve le champ OTP lié à un champ Email
 * Recherche dans les sections qui SUIVENT la section Email
 */
export function findLinkedOTPField(
  emailField: FormField,
  allSections: Section[],
  emailSectionIndex: number
): FormField | undefined {
  if (!emailField.emailFormFieldExecOptions?.linkedOTPFieldName) {
    return undefined;
  }

  const otpFieldName = emailField.emailFormFieldExecOptions.linkedOTPFieldName;
  
  // Rechercher uniquement dans les sections qui suivent la section Email
  for (let i = emailSectionIndex + 1; i < allSections.length; i++) {
    const section = allSections[i];
    const otpField = section.formFields?.find(
      (field) => field.fieldName === otpFieldName && field.fieldType === "OTP"
    );
    
    if (otpField) {
      return otpField;
    }
  }
  
  return undefined;
}
