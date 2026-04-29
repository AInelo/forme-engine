import { useMemo, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import type { FormField, ValidationRule } from '../types/formTypeStructure';
import { getLocalizedText } from '../FormFieldWrapper';

/**
 * Hook pour générer automatiquement des champs texte "autre" 
 * lorsque l'utilisateur sélectionne "autre" ou "autres" dans un champ dropdown, radio ou checkbox
 */
export const useAutoOtherField = (
  fields: FormField[],
  currentLang: string = 'fr'
): Record<string, FormField> => {
  const { watch, setValue } = useFormContext();

  // Surveiller toutes les valeurs du formulaire
  const formValues = watch();

  // Filtrer les champs qui peuvent générer un champ "autre"
  const eligibleFields = useMemo(() => {
    return fields.filter(field => 
      (field.fieldType === 'dropdown' || 
       field.fieldType === 'radio' || 
       field.fieldType === 'checkbox') &&
      field.selectOptions?.some(opt => {
        const optionValue = typeof opt.value === 'string' ? opt.value : String(opt.value);
        return optionValue === 'autre' || optionValue === 'autres';
      })
    );
  }, [fields]);

  // Générer les champs "autre" dynamiquement
  const autoOtherFields = useMemo(() => {
    const generatedFields: Record<string, FormField> = {};

    eligibleFields.forEach(parentField => {
      const parentFieldName = parentField.fieldName;
      const parentValue = formValues[parentFieldName];
      const otherFieldName = `autre_${parentFieldName}`;

      // Vérifier si "autre" ou "autres" est sélectionné
      let shouldShowOtherField = false;

      if (parentField.fieldType === 'checkbox') {
        // Pour checkbox : vérifier si le tableau contient "autre" ou "autres"
        if (Array.isArray(parentValue)) {
          shouldShowOtherField = parentValue.includes('autre') || parentValue.includes('autres');
        }
      } else {
        // Pour dropdown et radio : vérifier la valeur exacte
        shouldShowOtherField = parentValue === 'autre' || parentValue === 'autres';
      }

      if (shouldShowOtherField) {
        // Générer le label "Autre [label parent]"
        const parentLabel = getLocalizedText(parentField.label, currentLang);
        const otherLabel = typeof parentField.label === 'string' 
          ? `Autre ${parentLabel}`
          : Object.keys(parentField.label).reduce((acc, lang) => {
              acc[lang] = `Autre ${getLocalizedText(parentField.label, lang)}`;
              return acc;
            }, {} as { [lang: string]: string });

        // Hériter des validations required du parent
        const validations: ValidationRule[] = [];
        const parentRequired = parentField.validations?.some(
          v => v.validationType === 'required'
        );

        if (parentRequired) {
          validations.push({
            validationType: 'required',
            errMsg: `Veuillez préciser votre choix`
          });
        }

        // Créer le champ "autre"
        const otherField: FormField = {
          formFieldId: `autre_${parentField.formFieldId}`,
          fieldName: otherFieldName,
          fieldType: 'text',
          label: otherLabel,
          response: { responseValue: formValues[otherFieldName] || '' },
          validations: validations.length > 0 ? validations : undefined,
          placeholder: parentField.placeholder,
          width: parentField.width || 'half',
        };

        generatedFields[parentFieldName] = otherField;
      }
    });

    return generatedFields;
  }, [eligibleFields, formValues, currentLang]);

  // Nettoyage automatique : supprimer la valeur du champ "autre" quand "autre"/"autres" est désélectionné
  useEffect(() => {
    eligibleFields.forEach(parentField => {
      const parentFieldName = parentField.fieldName;
      const parentValue = formValues[parentFieldName];
      const otherFieldName = `autre_${parentFieldName}`;

      // Vérifier si "autre"/"autres" n'est plus sélectionné
      let shouldHaveOtherField = false;

      if (parentField.fieldType === 'checkbox') {
        if (Array.isArray(parentValue)) {
          shouldHaveOtherField = parentValue.includes('autre') || parentValue.includes('autres');
        }
      } else {
        shouldHaveOtherField = parentValue === 'autre' || parentValue === 'autres';
      }

      // Si le champ "autre" ne devrait plus être affiché mais a une valeur, nettoyer
      if (!shouldHaveOtherField && formValues[otherFieldName]) {
        setValue(otherFieldName, '', { shouldValidate: false, shouldTouch: false });
      }
    });
  }, [formValues, eligibleFields, setValue]);

  return autoOtherFields;
};

