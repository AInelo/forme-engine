import { useEffect, useState, useCallback, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import type { FormField } from '../types/formTypeStructure';

/**
 * Hook pour gérer le filtrage dynamique des champs de formulaire
 */
export const useDynamicFiltering = (fields: FormField[]) => {
  const { watch, setValue } = useFormContext();
  const [filteredFields, setFilteredFields] = useState<FormField[]>(fields);
  const previousValuesRef = useRef<Record<string, any>>({});

  // Fonction pour appliquer le filtrage à un champ
  const applyDynamicFilter = useCallback((field: FormField, formValues: Record<string, any>): FormField => {
    if (!field.dynamicFilterRule || field.fieldType !== 'dropdown') {
      return field;
    }

    const { dependentFieldName, dataSource } = field.dynamicFilterRule;
    const dependentValue = formValues[dependentFieldName];

    // console.log('🔍 [DynamicFiltering] Application du filtre:', {
      // fieldName: field.fieldName,
      // dependentField: dependentFieldName,
      // dependentValue,
      // hasDataSource: !!dataSource.data
    // });

    // 🆕 Si le champ parent est vide ou n'a pas de données correspondantes, vider les options
    if (!dependentValue || !dataSource.data[dependentValue]) {
      // console.log('⚠️ [DynamicFiltering] Aucune donnée trouvée pour:', dependentValue, '- Options vidées');
      return {
        ...field,
        selectOptions: [] // 🆕 Vider les options au lieu de retourner le champ tel quel
      };
    }

    const filteredOptions = dataSource.data[dependentValue];
    // console.log('✅ [DynamicFiltering] Options filtrées:', {
      // fieldName: field.fieldName,
      // optionsCount: filteredOptions.length,
      // options: filteredOptions.map(opt => opt.value)
    // });

    return {
      ...field,
      selectOptions: filteredOptions
    };
  }, []);

  // 🆕 Fonction pour trouver les champs qui dépendent d'un champ donné
  const findDependentFields = useCallback((fieldName: string): FormField[] => {
    return fields.filter(field => 
      field.dynamicFilterRule?.dependentFieldName === fieldName
    );
  }, [fields]);

  // 🆕 Fonction récursive pour réinitialiser une cascade de champs dépendants
  const resetCascade = useCallback((
    fieldName: string,
    formValues: Record<string, any>
  ) => {
    const dependentFields = findDependentFields(fieldName);
    
    dependentFields.forEach(dependentField => {
      const currentValue = formValues[dependentField.fieldName];
      if (currentValue) {
        // console.log(`🔄 [DynamicFiltering] Réinitialisation cascade: ${dependentField.fieldName} (dépend de ${fieldName})`);
        // Réinitialiser la valeur mais PAS les options (elles seront mises à jour par le filtrage)
        setValue(dependentField.fieldName, "", { shouldValidate: false });
      }
      
      // Réinitialiser récursivement les champs qui dépendent de celui-ci
      resetCascade(dependentField.fieldName, formValues);
    });
  }, [findDependentFields, setValue]);

  // Fonction pour appliquer le filtrage à tous les champs
  const applyFiltersToFields = useCallback((fields: FormField[], formValues: Record<string, any>): FormField[] => {
    return fields.map(field => applyDynamicFilter(field, formValues));
  }, [applyDynamicFilter]);

  // Surveiller les changements dans le formulaire
  useEffect(() => {
    // 🆕 Initialiser les valeurs précédentes avec les valeurs actuelles
    const initialValues = watch();
    previousValuesRef.current = { ...initialValues };
    
    const subscription = watch((formValues, { name: changedFieldName }) => {
      // console.log('👁️ [DynamicFiltering] Changement détecté dans le formulaire', { changedFieldName, formValues });
      
      // 🆕 TOUJOURS appliquer le filtrage avec les nouvelles valeurs (même si pas de changedFieldName)
      const updatedFields = applyFiltersToFields(fields, formValues);
      // console.log('📊 [DynamicFiltering] Champs après filtrage:', updatedFields.map(f => ({
        // fieldName: f.fieldName,
        // hasOptions: !!f.selectOptions?.length,
        // optionsCount: f.selectOptions?.length || 0
      // })));
      setFilteredFields(updatedFields);
      
      // 🆕 Ensuite, si un champ parent change ou devient vide, réinitialiser les cascades
      // Utiliser setTimeout pour laisser le temps au filtrage de s'appliquer d'abord
      if (changedFieldName) {
        const changedField = fields.find(f => f.fieldName === changedFieldName);
        const previousValue = previousValuesRef.current[changedFieldName];
        const currentValue = formValues[changedFieldName];
        
        // Si c'est un champ parent (qui n'a pas de dynamicFilterRule) et que sa valeur a changé
        if (changedField && !changedField.dynamicFilterRule && previousValue !== currentValue) {
          // Si le champ est devenu vide OU si on change d'une valeur à une autre (pas la première sélection)
          // Ne pas réinitialiser si c'est juste la première sélection (previousValue undefined/null et currentValue existe)
          if (!currentValue || (previousValue !== undefined && previousValue !== null && previousValue !== "")) {
            // console.log(`🔄 [DynamicFiltering] Champ parent ${changedFieldName} a changé, réinitialisation cascade`, {
              // previousValue,
              // currentValue
            // });
            // Utiliser setTimeout pour laisser le temps au filtrage de s'appliquer
            setTimeout(() => {
              resetCascade(changedFieldName, formValues);
            }, 0);
          } else {
            // console.log(`✅ [DynamicFiltering] Première sélection du champ parent ${changedFieldName}, pas de réinitialisation`);
          }
        }
        
        // Mettre à jour la référence des valeurs précédentes
        previousValuesRef.current = { ...formValues };
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, fields, applyFiltersToFields, resetCascade]);

  return filteredFields;
};

/**
 * Hook pour obtenir les champs avec filtrage appliqué pour une section spécifique
 */
export const useSectionDynamicFiltering = (sectionFields: FormField[]) => {
  const { watch, setValue, getValues } = useFormContext();
  const [filteredSectionFields, setFilteredSectionFields] = useState<FormField[]>(sectionFields);
  const previousValuesRef = useRef<Record<string, any>>({});

  // 🆕 Fonction pour trouver les champs qui dépendent d'un champ donné (dans cette section)
  const findDependentFields = useCallback((fieldName: string): FormField[] => {
    return sectionFields.filter(field => 
      field.dynamicFilterRule?.dependentFieldName === fieldName
    );
  }, [sectionFields]);

  // 🆕 Fonction récursive pour réinitialiser une cascade de champs dépendants
  const resetCascade = useCallback((
    fieldName: string,
    formValues: Record<string, any>
  ) => {
    const dependentFields = findDependentFields(fieldName);
    
    dependentFields.forEach(dependentField => {
      const currentValue = formValues[dependentField.fieldName];
      if (currentValue) {
        // console.log(`🔄 [SectionDynamicFiltering] Réinitialisation cascade: ${dependentField.fieldName} (dépend de ${fieldName})`);
        setValue(dependentField.fieldName, "", { shouldValidate: false });
      }
      
      // Réinitialiser récursivement les champs qui dépendent de celui-ci
      resetCascade(dependentField.fieldName, formValues);
    });
  }, [findDependentFields, setValue]);

  // Fonction pour appliquer le filtrage à un champ
  const applyDynamicFilter = useCallback((field: FormField, formValues: Record<string, any>): FormField => {
    if (!field.dynamicFilterRule || field.fieldType !== 'dropdown') {
      return field;
    }

    const { dependentFieldName, dataSource } = field.dynamicFilterRule;
    const dependentValue = formValues[dependentFieldName];

    // console.log('🔍 [SectionDynamicFiltering] Application du filtre:', {
      // fieldName: field.fieldName,
      // dependentField: dependentFieldName,
      // dependentValue,
      // hasDataSource: !!dataSource.data
    // });

    // 🆕 Si le champ parent est vide ou n'a pas de données correspondantes, vider les options
    if (!dependentValue || !dataSource.data[dependentValue]) {
      // console.log('⚠️ [SectionDynamicFiltering] Aucune donnée trouvée pour:', dependentValue, '- Options vidées');
      return {
        ...field,
        selectOptions: [] // 🆕 Vider les options au lieu de retourner le champ tel quel
      };
    }

    const filteredOptions = dataSource.data[dependentValue];
    // console.log('✅ [SectionDynamicFiltering] Options filtrées:', {
      // fieldName: field.fieldName,
      // optionsCount: filteredOptions.length,
      // options: filteredOptions.map(opt => opt.value)
    // });

    return {
      ...field,
      selectOptions: filteredOptions
    };
  }, []);

  // Fonction pour appliquer le filtrage à tous les champs de la section
  const applyFiltersToSectionFields = useCallback((fields: FormField[], formValues: Record<string, any>): FormField[] => {
    return fields.map(field => applyDynamicFilter(field, formValues));
  }, [applyDynamicFilter]);

  // Surveiller les changements dans le formulaire
  useEffect(() => {
    // 🆕 Initialiser les valeurs précédentes avec les valeurs actuelles
    const initialValues = watch();
    previousValuesRef.current = { ...initialValues };
    
    const subscription = watch((formValues, { name: changedFieldName }) => {
      // console.log('👁️ [SectionDynamicFiltering] Changement détecté dans la section', { changedFieldName, formValues });
      
      // 🆕 Utiliser requestAnimationFrame + setTimeout pour s'assurer que React a bien mis à jour les valeurs
      // après un setValue de react-hook-form, puis utiliser getValues() pour récupérer les valeurs synchrones
      requestAnimationFrame(() => {
        setTimeout(() => {
          // 🆕 Utiliser getValues() pour récupérer les valeurs les plus récentes au moment du filtrage
          // Le problème: formValues du callback watch() peut être obsolète si watch() se déclenche avant que setValue() ne soit terminé
          // Solution: utiliser getValues() qui récupère la valeur au moment de l'appel
          const currentFormValues = getValues();
          
          // 🆕 TOUJOURS appliquer le filtrage avec les nouvelles valeurs (même si pas de changedFieldName)
          const updatedFields = applyFiltersToSectionFields(sectionFields, currentFormValues);
          // console.log('📊 [SectionDynamicFiltering] Champs après filtrage:', updatedFields.map(f => ({
            // fieldName: f.fieldName,
            // hasOptions: !!f.selectOptions?.length,
            // optionsCount: f.selectOptions?.length || 0
          // })));
          setFilteredSectionFields(updatedFields);
          
          // 🆕 Ensuite, si un champ parent change ou devient vide, réinitialiser les cascades
          // Utiliser setTimeout pour laisser le temps au filtrage de s'appliquer d'abord
          if (changedFieldName) {
            const changedField = sectionFields.find(f => f.fieldName === changedFieldName);
            const previousValue = previousValuesRef.current[changedFieldName];
            const currentValue = currentFormValues[changedFieldName];
            
            // Si c'est un champ parent (qui n'a pas de dynamicFilterRule) et que sa valeur a changé
            if (changedField && !changedField.dynamicFilterRule && previousValue !== currentValue) {
              // Si le champ est devenu vide OU si on change d'une valeur à une autre (pas la première sélection)
              // Ne pas réinitialiser si c'est juste la première sélection (previousValue undefined/null et currentValue existe)
              if (!currentValue || (previousValue !== undefined && previousValue !== null && previousValue !== "")) {
                // console.log(`🔄 [SectionDynamicFiltering] Champ parent ${changedFieldName} a changé, réinitialisation cascade`, {
                  // previousValue,
                  // currentValue
                // });
                // Utiliser setTimeout pour laisser le temps au filtrage de s'appliquer
                setTimeout(() => {
                  resetCascade(changedFieldName, currentFormValues);
                }, 0);
              } else {
                // console.log(`✅ [SectionDynamicFiltering] Première sélection du champ parent ${changedFieldName}, pas de réinitialisation`);
              }
            }
            
            // Mettre à jour la référence des valeurs précédentes
            previousValuesRef.current = { ...currentFormValues };
          }
        }, 10); // Petit délai pour garantir que setValue est terminé
      });
    });

    return () => subscription.unsubscribe();
  }, [watch, getValues, sectionFields, applyFiltersToSectionFields, resetCascade]);

  return filteredSectionFields;
};

/**
 * Hook pour gérer le filtrage dans les repeatGroup avec champs temporaires
 * Optimisé pour réduire les re-rendus
 */
export const useRepeatGroupDynamicFiltering = (repeatGroupFields: FormField[], repeatGroupName: string, index: number = 0) => {
  const { watch, setValue, getValues } = useFormContext();
  const [filteredRepeatGroupFields, setFilteredRepeatGroupFields] = useState<FormField[]>(repeatGroupFields);
  const previousValuesRef = useRef<Record<string, any>>({});

  // Fonction pour extraire la valeur d'un champ temporaire dans un RepeatGroup
  // 🆕 Utilise getValues() pour récupérer la valeur la plus récente au moment de l'appel
  // Ne se fie PAS à formValues qui peut être obsolète dans les RepeatGroups
  // Cette logique est spécifique aux RepeatGroups et différente de useSectionDynamicFiltering
  // Le problème: watch() peut être appelé avant que React Hook Form n'ait mis à jour la valeur
  // Solution: utiliser getValues() qui récupère la valeur au moment de l'appel, pas au moment de la souscription
  const getTempFieldValue = useCallback((formValues: Record<string, any>, baseFieldName: string, index: number, getValuesFn?: () => Record<string, any>): string | undefined => {
    const tempFieldName = `${repeatGroupName}_${baseFieldName}_${index}`;
    
    // 🆕 Pour les RepeatGroups, utiliser getValues() si fourni (dans le setTimeout)
    // Sinon, utiliser watch() comme fallback (mais peut être obsolète)
    // getValues() récupère la valeur au moment de l'appel, ce qui est plus fiable pour les RepeatGroups
    const currentFormValues = getValuesFn ? getValuesFn() : null;
    const value = currentFormValues ? currentFormValues[tempFieldName] : watch(tempFieldName);
    
    // console.log('🔎 [RepeatGroupDynamicFiltering] getTempFieldValue:', {
      // baseFieldName,
      // tempFieldName,
      // value,
      // hasGetValuesFn: !!getValuesFn,
      // valueFromGetValues: currentFormValues ? currentFormValues[tempFieldName] : undefined,
      // valueFromWatch: watch(tempFieldName),
      // valueType: typeof value,
      // isUndefined: value === undefined,
      // isNull: value === null,
      // isEmptyString: value === ''
    // });
    return value;
  }, [repeatGroupName, watch]);

  // 🆕 Fonction pour obtenir le nom temporaire d'un champ
  const getTempFieldName = useCallback((baseFieldName: string, index: number): string => {
    return `${repeatGroupName}_${baseFieldName}_${index}`;
  }, [repeatGroupName]);

  // 🆕 Fonction pour trouver les champs qui dépendent d'un champ donné (dans ce repeatGroup)
  const findDependentFields = useCallback((fieldName: string): FormField[] => {
    return repeatGroupFields.filter(field => 
      field.dynamicFilterRule?.dependentFieldName === fieldName
    );
  }, [repeatGroupFields]);

  // 🆕 Fonction récursive pour réinitialiser une cascade de champs dépendants dans un repeatGroup
  const resetCascade = useCallback((
    fieldName: string,
    formValues: Record<string, any>
  ) => {
    const dependentFields = findDependentFields(fieldName);
    
    dependentFields.forEach(dependentField => {
      const tempFieldName = getTempFieldName(dependentField.fieldName, index);
      const currentValue = formValues[tempFieldName];
      if (currentValue) {
        // console.log(`🔄 [RepeatGroupDynamicFiltering] Réinitialisation cascade: ${tempFieldName} (dépend de ${getTempFieldName(fieldName, index)})`);
        setValue(tempFieldName, "", { shouldValidate: false });
      }
      
      // Réinitialiser récursivement les champs qui dépendent de celui-ci
      resetCascade(dependentField.fieldName, formValues);
    });
  }, [findDependentFields, setValue, getTempFieldName, index]);

  // Fonction pour appliquer le filtrage à un champ dans un repeatGroup
  // 🆕 Logique spécifique aux RepeatGroups : utilise getValues() via getTempFieldValue
  // Ne se fie PAS à formValues qui peut être obsolète
  const applyRepeatGroupDynamicFilter = useCallback((field: FormField, formValues: Record<string, any>, index: number, getValuesFn?: () => Record<string, any>): FormField => {
    if (!field.dynamicFilterRule || field.fieldType !== 'dropdown') {
      return field;
    }

    const { dependentFieldName, dataSource } = field.dynamicFilterRule;
    
    // 🆕 Pour les RepeatGroups, utiliser getTempFieldValue avec getValuesFn si fourni
    // Cela garantit qu'on récupère toujours la valeur la plus récente au moment de l'appel
    const dependentValue = getTempFieldValue(formValues, dependentFieldName, index, getValuesFn);

    // console.log('🔍 [RepeatGroupDynamicFiltering] Application du filtre:', {
      // fieldName: field.fieldName,
      // tempFieldName: `${repeatGroupName}_${field.fieldName}_${index}`,
      // dependentField: dependentFieldName,
      // tempDependentFieldName: `${repeatGroupName}_${dependentFieldName}_${index}`,
      // dependentValue,
      // hasDataSource: !!dataSource.data
    // });

    // 🆕 Si le champ parent est vide ou n'a pas de données correspondantes, vider les options
    // 🆕 Normaliser la valeur pour la comparaison (trim, lowercase pour éviter les problèmes de casse)
    const normalizedValue = dependentValue ? String(dependentValue).trim().toLowerCase() : '';
    const hasExactMatch = dependentValue && dataSource.data[dependentValue];
    
    // 🆕 Chercher aussi avec la valeur normalisée si pas de correspondance exacte
    let matchingKey = dependentValue;
    if (!hasExactMatch && normalizedValue) {
      matchingKey = Object.keys(dataSource.data || {}).find(key => 
        key.toLowerCase() === normalizedValue
      ) || dependentValue;
    }
    
    if (!dependentValue || dependentValue === '' || !dataSource.data[matchingKey]) {
      // console.log('⚠️ [RepeatGroupDynamicFiltering] Aucune donnée trouvée pour:', {
        // dependentValue,
        // normalizedValue,
        // matchingKey,
        // dependentValueType: typeof dependentValue,
        // isEmpty: dependentValue === '',
        // isNull: dependentValue === null,
        // isUndefined: dependentValue === undefined,
        // hasExactMatch,
        // hasDataForMatchingKey: matchingKey ? matchingKey in dataSource.data : false,
        // availableKeys: Object.keys(dataSource.data || {}).slice(0, 10), // Limiter pour ne pas surcharger les logs
        // dataSourceKeys: dataSource.data ? Object.keys(dataSource.data).slice(0, 10) : []
      // }, '- Options vidées');
      return {
        ...field,
        selectOptions: [] // 🆕 Vider les options au lieu de retourner le champ tel quel
      };
    }

    // 🆕 Utiliser la clé correspondante (exacte ou normalisée)
    const finalKey = matchingKey;

    const filteredOptions = dataSource.data[finalKey];
    if (!Array.isArray(filteredOptions)) {
      console.error('❌ [RepeatGroupDynamicFiltering] Les options filtrées ne sont pas un tableau:', {
        fieldName: field.fieldName,
        dependentValue,
        finalKey,
        filteredOptions,
        type: typeof filteredOptions
      });
      return {
        ...field,
        selectOptions: []
      };
    }

    // console.log('✅ [RepeatGroupDynamicFiltering] Options filtrées:', {
      // fieldName: field.fieldName,
      // index,
      // dependentValue,
      // finalKey,
      // optionsCount: filteredOptions.length,
      // options: filteredOptions.map(opt => opt.value)
    // });

    return {
      ...field,
      selectOptions: filteredOptions
    };
  }, [getTempFieldValue, repeatGroupName]);

  // Fonction pour appliquer le filtrage à tous les champs du repeatGroup
  const applyFiltersToRepeatGroupFields = useCallback((fields: FormField[], formValues: Record<string, any>, index: number, getValuesFn?: () => Record<string, any>): FormField[] => {
    return fields.map(field => applyRepeatGroupDynamicFilter(field, formValues, index, getValuesFn));
  }, [applyRepeatGroupDynamicFilter]);

  // Surveiller les changements dans le formulaire
  useEffect(() => {
    // 🆕 Initialiser les valeurs précédentes avec les valeurs actuelles
    const initialValues = watch();
    previousValuesRef.current = { ...initialValues };
    
    const subscription = watch((formValues, { name: changedFieldName }) => {
      // 🆕 Filtrer les clés du formulaire pour ce repeatGroup
      const relevantKeys = Object.keys(formValues).filter(k => k.startsWith(`${repeatGroupName}_`) && k.endsWith(`_${index}`));
      const relevantValues = relevantKeys.reduce((acc, key) => {
        acc[key] = formValues[key];
        return acc;
      }, {} as Record<string, any>);
      
      // console.log('👁️ [RepeatGroupDynamicFiltering] Changement détecté dans le repeatGroup:', repeatGroupName, 'index:', index, { 
        // changedFieldName,
        // relevantValues,
        // allRelevantKeys: relevantKeys
      // });
      
      // 🆕 D'abord appliquer le filtrage avec les nouvelles valeurs
      // Utiliser requestAnimationFrame + setTimeout pour s'assurer que React a bien mis à jour les valeurs
      // après un setValue de react-hook-form
      requestAnimationFrame(() => {
        // 🆕 Utiliser un petit setTimeout en plus pour garantir que setValue est complètement terminé
        // Cela résout le problème où watch() se déclenche avant que setValue ne soit terminé
        setTimeout(() => {
          // 🆕 LOGIQUE SPÉCIFIQUE AUX REPEATGROUPS
          // Pour les RepeatGroups, utiliser getValues() dans le setTimeout pour récupérer les valeurs les plus récentes
          // Le problème: watch() peut être appelé avant que React Hook Form n'ait mis à jour la valeur après setValue()
          // Solution: utiliser getValues() qui récupère la valeur au moment de l'appel, pas au moment de la souscription
          // Cette logique est différente de useSectionDynamicFiltering qui utilise formValues directement
          
          // 🆕 Utiliser getValues() pour récupérer les valeurs les plus récentes au moment du filtrage
          // Cela résout le problème de timing où watch() peut être obsolète
          const currentFormValues = getValues();
          const updatedFields = applyFiltersToRepeatGroupFields(repeatGroupFields, formValues, index, () => currentFormValues);
          // console.log('📊 [RepeatGroupDynamicFiltering] Champs après filtrage:', updatedFields.map(f => ({
            // fieldName: f.fieldName,
            // hasOptions: !!f.selectOptions?.length,
            // optionsCount: f.selectOptions?.length || 0,
            // hasDynamicFilter: !!f.dynamicFilterRule,
            // dependentField: f.dynamicFilterRule?.dependentFieldName,
            // dependentValue: f.dynamicFilterRule ? getTempFieldValue(formValues, f.dynamicFilterRule.dependentFieldName, index, () => currentFormValues) : undefined
          // })));
          setFilteredRepeatGroupFields(updatedFields);
        }, 10); // Petit délai pour garantir que setValue est terminé
      });
      
      // 🆕 Ensuite, si un champ parent change ou devient vide, réinitialiser les cascades
      // Utiliser setTimeout pour laisser le temps au filtrage de s'appliquer d'abord
      if (changedFieldName) {
        // Vérifier si le champ modifié appartient à ce repeatGroup
        const isInThisRepeatGroup = changedFieldName.startsWith(`${repeatGroupName}_`) && 
                                     changedFieldName.endsWith(`_${index}`);
        
        if (isInThisRepeatGroup) {
          // Extraire le nom de base du champ
          const baseFieldName = changedFieldName.replace(`${repeatGroupName}_`, '').replace(`_${index}`, '');
          const changedField = repeatGroupFields.find(f => f.fieldName === baseFieldName);
          const previousValue = previousValuesRef.current[changedFieldName];
          const currentValue = formValues[changedFieldName];
          
          // console.log('🔍 [RepeatGroupDynamicFiltering] Champ modifié dans ce repeatGroup:', {
            // baseFieldName,
            // changedFieldName,
            // previousValue,
            // currentValue,
            // hasDynamicFilter: !!changedField?.dynamicFilterRule,
            // isParent: changedField && !changedField.dynamicFilterRule
          // });
          
          // Si c'est un champ parent (qui n'a pas de dynamicFilterRule) et que sa valeur a changé
          // 🆕 IMPORTANT: Le filtrage se déclenche toujours (déjà fait plus haut), mais on doit réinitialiser les cascades
          // seulement si la valeur a vraiment changé (pas juste si le watch se déclenche)
          if (changedField && !changedField.dynamicFilterRule) {
            // 🆕 Vérifier si la valeur a vraiment changé (pas juste le watch qui se déclenche)
            const hasValueChanged = previousValue !== currentValue;
            
            if (hasValueChanged) {
              // Si le champ est devenu vide OU si on change d'une valeur à une autre (pas la première sélection)
              // Ne pas réinitialiser si c'est juste la première sélection (previousValue undefined/null et currentValue existe)
              if (!currentValue || (previousValue !== undefined && previousValue !== null && previousValue !== "")) {
                // console.log(`🔄 [RepeatGroupDynamicFiltering] Champ parent ${baseFieldName} a changé, réinitialisation cascade`, {
                  // previousValue,
                  // currentValue,
                  // hasValueChanged
                // });
                // Utiliser setTimeout pour laisser le temps au filtrage de s'appliquer
                setTimeout(() => {
                  resetCascade(baseFieldName, formValues);
                }, 0);
              } else {
                // console.log(`✅ [RepeatGroupDynamicFiltering] Première sélection du champ parent ${baseFieldName}, pas de réinitialisation`);
              }
            } else {
              // console.log(`ℹ️ [RepeatGroupDynamicFiltering] Champ ${baseFieldName} n'a pas changé (watch déclenché mais valeur identique)`, {
                // previousValue,
                // currentValue
              // });
            }
          }
          
          // Mettre à jour la référence des valeurs précédentes
          previousValuesRef.current = { ...previousValuesRef.current, [changedFieldName]: currentValue };
        } else {
          // 🆕 Même si le champ modifié n'est pas dans ce repeatGroup, on doit quand même réappliquer le filtrage
          // car un changement ailleurs peut affecter les dépendances
          // console.log('🔄 [RepeatGroupDynamicFiltering] Changement détecté ailleurs, réapplication du filtrage pour ce repeatGroup');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, getValues, repeatGroupFields, repeatGroupName, index, applyFiltersToRepeatGroupFields, resetCascade, getTempFieldValue, getTempFieldName]);

  return filteredRepeatGroupFields;
}; 