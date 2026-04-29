import { useMemo, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import type { FormField } from '../types/formTypeStructure';
import { getLocalizedText } from '../FormFieldWrapper';

/**
 * Type pour représenter un groupe de champs de détails
 */
export interface DetailInfoGroup {
  groupLabel?: string;
  fields: FormField[];
  optionValue: string;
}

/**
 * Hook pour générer automatiquement des champs de détails
 * lorsque l'utilisateur sélectionne une option dans un champ dropdown, radio ou checkbox
 */
export const useDetailInfos = (
  fields: FormField[],
  currentLang: string = 'fr'
): Record<string, DetailInfoGroup[]> => {
  const { watch, setValue } = useFormContext();

  // Surveiller toutes les valeurs du formulaire
  const formValues = watch();

  // Filtrer les champs qui ont detailInfos configuré
  const eligibleFields = useMemo(() => {
    return fields.filter(field => 
      (field.fieldType === 'dropdown' || 
       field.fieldType === 'radio' || 
       field.fieldType === 'checkbox') &&
      field.detailInfos &&
      Object.keys(field.detailInfos).length > 0
    );
  }, [fields]);

  // Générer les groupes de champs de détails dynamiquement
  const detailInfosGroups = useMemo(() => {
    const generatedGroups: Record<string, DetailInfoGroup[]> = {};

    eligibleFields.forEach(parentField => {
      const parentFieldName = parentField.fieldName;
      const parentValue = formValues[parentFieldName];
      const groups: DetailInfoGroup[] = [];

      if (!parentField.detailInfos) return;

      if (parentField.fieldType === 'checkbox') {
        // Pour checkbox : générer un groupe pour chaque option sélectionnée
        if (Array.isArray(parentValue)) {
          parentValue.forEach((optionValue: string) => {
            const detailConfig = parentField.detailInfos![optionValue];
            if (detailConfig) {
              const groupLabel = detailConfig.label 
                ? getLocalizedText(detailConfig.label, currentLang)
                : undefined;

              // Générer les champs avec les noms transformés
              const detailFields: FormField[] = detailConfig.formFields.map(detailField => {
                const detailFieldName = `${parentFieldName}_${optionValue}_${detailField.fieldName}`;
                return {
                  ...detailField,
                  formFieldId: `${parentField.formFieldId}_${optionValue}_${detailField.formFieldId}`,
                  fieldName: detailFieldName,
                  response: { 
                    responseValue: formValues[detailFieldName] || (detailField.response?.responseValue ?? '') 
                  },
                  width: detailField.width || parentField.width || 'half',
                };
              });

              groups.push({
                groupLabel,
                fields: detailFields,
                optionValue,
              });
            }
          });
        }
      } else {
        // Pour dropdown et radio : générer un seul groupe si une option est sélectionnée
        if (parentValue && typeof parentValue === 'string') {
          const detailConfig = parentField.detailInfos![parentValue];
          if (detailConfig) {
            const groupLabel = detailConfig.label 
              ? getLocalizedText(detailConfig.label, currentLang)
              : undefined;

            // Générer les champs avec les noms transformés
            const detailFields: FormField[] = detailConfig.formFields.map(detailField => {
              const detailFieldName = `${parentFieldName}_${parentValue}_${detailField.fieldName}`;
              return {
                ...detailField,
                formFieldId: `${parentField.formFieldId}_${parentValue}_${detailField.formFieldId}`,
                fieldName: detailFieldName,
                response: { 
                  responseValue: formValues[detailFieldName] || (detailField.response?.responseValue ?? '') 
                },
                width: detailField.width || parentField.width || 'half',
              };
            });

            groups.push({
              groupLabel,
              fields: detailFields,
              optionValue: parentValue,
            });
          }
        }
      }

      if (groups.length > 0) {
        generatedGroups[parentFieldName] = groups;
      }
    });

    return generatedGroups;
  }, [eligibleFields, formValues, currentLang]);

  // Nettoyage automatique : supprimer les valeurs des champs de détails quand une option est désélectionnée
  useEffect(() => {
    eligibleFields.forEach(parentField => {
      const parentFieldName = parentField.fieldName;
      const parentValue = formValues[parentFieldName];

      if (!parentField.detailInfos) return;

      if (parentField.fieldType === 'checkbox') {
        // Pour checkbox : nettoyer uniquement les champs des options non sélectionnées
        if (Array.isArray(parentValue)) {
          Object.keys(parentField.detailInfos).forEach(optionValue => {
            if (!parentValue.includes(optionValue)) {
              // Option désélectionnée : nettoyer ses champs de détails
              const detailConfig = parentField.detailInfos![optionValue];
              if (detailConfig) {
                detailConfig.formFields.forEach(detailField => {
                  const detailFieldName = `${parentFieldName}_${optionValue}_${detailField.fieldName}`;
                  if (formValues[detailFieldName]) {
                    setValue(detailFieldName, '', { shouldValidate: false, shouldTouch: false });
                  }
                });
              }
            }
          });
        } else {
          // Si la valeur n'est plus un tableau, nettoyer tous les champs de détails
          Object.keys(parentField.detailInfos).forEach(optionValue => {
            const detailConfig = parentField.detailInfos![optionValue];
            if (detailConfig) {
              detailConfig.formFields.forEach(detailField => {
                const detailFieldName = `${parentFieldName}_${optionValue}_${detailField.fieldName}`;
                if (formValues[detailFieldName]) {
                  setValue(detailFieldName, '', { shouldValidate: false, shouldTouch: false });
                }
              });
            }
          });
        }
      } else {
        // Pour dropdown et radio : nettoyer si une autre option est sélectionnée ou si aucune option
        const currentOptionValue = parentValue && typeof parentValue === 'string' ? parentValue : null;
        Object.keys(parentField.detailInfos).forEach(optionValue => {
          if (optionValue !== currentOptionValue) {
            // Option non sélectionnée : nettoyer ses champs de détails
            const detailConfig = parentField.detailInfos![optionValue];
            if (detailConfig) {
              detailConfig.formFields.forEach(detailField => {
                const detailFieldName = `${parentFieldName}_${optionValue}_${detailField.fieldName}`;
                if (formValues[detailFieldName]) {
                  setValue(detailFieldName, '', { shouldValidate: false, shouldTouch: false });
                }
              });
            }
          }
        });
      }
    });
  }, [formValues, eligibleFields, setValue]);

  return detailInfosGroups;
};

