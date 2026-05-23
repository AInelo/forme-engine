import React, { useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import FieldRenderer from '../../FieldRenderer';
import { useRepeatGroupDynamicFiltering } from '../../hooks/useDynamicFiltering';
import { useAutoOtherField } from '../../hooks/useAutoOtherField';
import { useDetailInfos, type DetailInfoGroup } from '../../hooks/useDetailInfos';
import type { FormField } from '../../types/formTypeStructure';

interface SeriesItemProps {
  index: number;
  repeatGroup: any;
  existingGroupData: Record<string, any>;
  buildTempFieldName: (childFieldName: string, index: number) => string;
  buildNestedGroupFieldName: (childGroupFieldName: string, index: number) => string;
  buildNestedChildFieldName: (
    childGroupFieldName: string,
    index: number,
    childFieldName: string,
    nestedIndex: number
  ) => string;
  isExpanded: boolean;
  isViewMode: boolean;
  currentLang: string;
  formValues: Record<string, any>;
  onToggle: (index: number) => void;
  seriesRef: (el: HTMLDivElement | null) => void;
}

const SeriesItem: React.FC<SeriesItemProps> = ({
  index,
  repeatGroup,
  existingGroupData,
  buildTempFieldName,
  buildNestedGroupFieldName,
  buildNestedChildFieldName,
  isExpanded,
  isViewMode,
  currentLang,
  formValues,
  onToggle,
  seriesRef
}) => {
  const { getValues, watch } = useFormContext();

  // Application du filtrage dynamique aux champs du repeatGroup avec l'index spécifique
  const filteredRepeatGroupFields = useRepeatGroupDynamicFiltering(
    repeatGroup.formFields,
    repeatGroup.fieldName,
    index
  );

  // 🆕 Générer les champs "autre" pour les champs du repeatGroup
  // Créer des champs avec les noms transformés pour le hook
  const fieldsWithTransformedNames = useMemo(() => {
    return filteredRepeatGroupFields.map(subField => ({
      ...subField,
      fieldName: buildTempFieldName(subField.fieldName, index),
      // Pour le hook, on doit aussi transformer le formFieldId pour l'unicité
      formFieldId: `${subField.formFieldId}_${index}`,
    }));
  }, [filteredRepeatGroupFields, index, buildTempFieldName]);

  const autoOtherFields = useAutoOtherField(fieldsWithTransformedNames, currentLang);

  // 🆕 Générer les groupes de détails pour les champs du repeatGroup
  const detailInfosGroups = useDetailInfos(fieldsWithTransformedNames, currentLang);

  // 🆕 Créer une liste de champs avec les champs "autre" et les groupes de détails injectés
  const fieldsWithAutoOtherAndDetails = useMemo(() => {
    const result: Array<{ 
      field: FormField; 
      isOtherField: boolean; 
      isDetailGroup?: boolean;
      detailGroup?: DetailInfoGroup;
      originalFieldName?: string 
    }> = [];
    
    filteredRepeatGroupFields.forEach(subField => {
      const tempName = buildTempFieldName(subField.fieldName, index);
      
      // Ajouter le champ parent
      result.push({ field: subField, isOtherField: false });
      
      // Si un champ "autre" existe pour ce champ parent, l'ajouter
      // Le hook retourne les champs avec les noms transformés, donc on cherche avec tempName
      const otherField = autoOtherFields[tempName];
      if (otherField) {
        // Adapter le nom du champ "autre" pour qu'il corresponde au pattern du repeatGroup
        const adaptedOtherField: FormField = {
          ...otherField,
          fieldName: `autre_${tempName}`, // autre_membres_langue_0
        };
        result.push({ 
          field: adaptedOtherField, 
          isOtherField: true,
          originalFieldName: subField.fieldName
        });
      }
      
      // Si des groupes de détails existent pour ce champ parent, les ajouter
      const detailGroups = detailInfosGroups[tempName];
      if (detailGroups && detailGroups.length > 0) {
        detailGroups.forEach(group => {
          // Adapter les noms des champs de détails pour correspondre au pattern du repeatGroup
          const adaptedDetailFields: FormField[] = group.fields.map(detailField => {
            // Le hook génère : "{tempName}_{optionValue}_{detailFieldName}"
            // On doit garder ce format car tempName est déjà transformé
            return {
              ...detailField,
              // Le nom est déjà correct (tempName contient déjà le pattern repeatGroup)
            };
          });
          
          result.push({
            field: subField, // Placeholder, ne sera pas utilisé
            isOtherField: false,
            isDetailGroup: true,
            detailGroup: {
              ...group,
              fields: adaptedDetailFields,
            },
            originalFieldName: subField.fieldName,
          });
        });
      }
    });
    
    return result;
  }, [filteredRepeatGroupFields, autoOtherFields, detailInfosGroups, index, buildTempFieldName]);

  return (
    <div className="group relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg sm:rounded-xl border border-gray-200 hover:border-[#008080] transition-all duration-300 overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(index)}
        className="w-full p-4 sm:p-6 flex items-center justify-between bg-white/50 hover:bg-white/70 transition-colors border-b border-gray-200"
      >
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-[#008080] to-[#006666] text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
            Série {index + 1}
          </div>
          <span className="text-sm text-gray-600 font-medium">
            {isExpanded ? 'Cliquez pour fermer' : 'Cliquez pour ouvrir'}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-[#008080]">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </button>
      
      <div
        ref={seriesRef}
        className={`${!isExpanded ? 'h-0 opacity-0' : ''} overflow-hidden`}
      >
        <div className="p-4 sm:p-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          {fieldsWithAutoOtherAndDetails.map(({ field: subField, isOtherField, isDetailGroup, detailGroup, originalFieldName }) => {
            // Si c'est un groupe de détails, le rendre séparément
            if (isDetailGroup && detailGroup) {
              return (
                <div
                  key={`detail-group-${detailGroup.optionValue}-${index}`}
                  className="col-span-1 sm:col-span-2 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  {detailGroup.groupLabel && (
                    <h4 className="font-semibold text-gray-700 mb-3 text-sm">
                      {detailGroup.groupLabel}
                    </h4>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {detailGroup.fields.map((detailField) => {
                      const detailFieldName = detailField.fieldName;
                      // Le nom du champ de détail est déjà transformé (ex: "membres_langue_0_fr_niveau")
                      // Pour existingGroupData, on sauvegarde avec le format: "{parentFieldName}_{optionValue}_{detailFieldName}"
                      // On doit construire cette clé pour récupérer la valeur
                      const detailFieldOriginalName = detailField.fieldName.split('_').slice(-1)[0]; // Dernière partie = nom original
                      const detailDataKey = originalFieldName 
                        ? `${originalFieldName}_${detailGroup.optionValue}_${detailFieldOriginalName}`
                        : detailFieldName;
                      const detailFieldValue = existingGroupData[detailDataKey] ?? "";
                      
                      const detailFieldFormValues = {
                        ...formValues,
                        [detailFieldName]: detailFieldValue,
                      };

                      return (
                        <div key={detailFieldName} className="space-y-2">
                          {isViewMode ? (
                            <div className="bg-white/80 p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm">
                              <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                                {detailField.fieldName}
                              </div>
                              <div className="text-gray-900 font-medium text-sm sm:text-base">
                                {getValues(detailFieldName) || <span className="text-gray-400 italic">Non renseigné</span>}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-white/80 rounded-lg p-1 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                              <FieldRenderer
                                field={detailField}
                                name={detailFieldName}
                                currentLang={currentLang}
                                formValues={detailFieldFormValues}
                                showControlButtons={false}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
            
            // Sinon, c'est un champ normal ou "autre"
            // Déterminer le nom du champ selon s'il s'agit d'un champ "autre" ou non
            const tempName = isOtherField 
              ? subField.fieldName // Déjà transformé (autre_membres_langue_0)
              : buildTempFieldName(subField.fieldName, index);
            
            // Pour les champs "autre", utiliser le nom original pour récupérer la valeur depuis existingGroupData
            // Le nom dans existingGroupData sera "autre_${originalFieldName}"
            const dataKey = isOtherField && originalFieldName 
              ? `autre_${originalFieldName}` 
              : subField.fieldName;
            
            // Pour les champs "autre", la valeur peut être dans existingGroupData avec la clé "autre_${originalFieldName}"
            const fieldValue = isOtherField && originalFieldName
              ? (existingGroupData[`autre_${originalFieldName}`] ?? "")
              : (existingGroupData[dataKey] ?? "");
            
            const fieldSpecificFormValues = {
              ...formValues,
              [tempName]: fieldValue,
            };

            // 🆕 Calculer le nom transformé du champ parent si dynamicFilterRule existe
            // (seulement pour les champs non-"autre")
            const dependentFieldNameTransformed = !isOtherField && subField.dynamicFilterRule
              ? buildTempFieldName(subField.dynamicFilterRule.dependentFieldName, index)
              : undefined;

            // Les champs "autre" ne peuvent pas avoir de repeatGroup
            if (!isOtherField && subField.repeatGroup && subField.repeatRule) {
              const nestedCount = Math.max(0, Number(watch(tempName)) || 0);
              const nestedGroupName = buildNestedGroupFieldName(subField.repeatGroup.fieldName, index);
              const nestedExistingData = Array.isArray(existingGroupData[subField.repeatGroup.fieldName])
                ? existingGroupData[subField.repeatGroup.fieldName]
                : [];

              return (
                <div key={`${tempName}_nested`} className="space-y-4 sm:col-span-2">
                  <div className="bg-white/80 rounded-lg p-1 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <FieldRenderer
                      field={subField}
                      name={tempName}
                      currentLang={currentLang}
                      formValues={fieldSpecificFormValues}
                      showControlButtons={false}
                      dependentFieldNameTransformed={dependentFieldNameTransformed}
                    />
                  </div>

                  {nestedCount > 0 && (
                    <div className="space-y-3">
                      {Array.from({ length: nestedCount }, (_, nestedIndex) => {
                        const nestedEntry = nestedExistingData[nestedIndex] ?? {};
                        return (
                          <div
                            key={`${nestedGroupName}_row_${nestedIndex}`}
                            className="border border-teal-200 rounded-lg bg-white/70 shadow-sm"
                          >
                            <div className="px-3 sm:px-4 py-2 bg-teal-50 border-b border-teal-100 text-sm sm:text-base font-semibold text-teal-700">
                              {currentLang === 'fr' ? `Dépendant ${nestedIndex + 1}` : `Dependant ${nestedIndex + 1}`}
                            </div>
                            <div className="p-3 sm:p-4 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                              {subField.repeatGroup!.formFields.map((childField: FormField) => {
                                const childKey = buildNestedChildFieldName(
                                  subField.repeatGroup!.fieldName,
                                  index,
                                  childField.fieldName,
                                  nestedIndex
                                );
                                const childFormValues = {
                                  ...formValues,
                                  [childKey]: nestedEntry?.[childField.fieldName] ?? "",
                                };

                                // 🆕 Calculer le nom transformé du champ parent pour les nested groups
                                // Pattern: {nestedGroupName}_{dependentFieldName}_{nestedIndex}
                                const nestedGroupBaseName = buildNestedGroupFieldName(subField.repeatGroup!.fieldName, index);
                                const dependentFieldNameTransformed = childField.dynamicFilterRule
                                  ? `${nestedGroupBaseName}_${childField.dynamicFilterRule.dependentFieldName}_${nestedIndex}`
                                  : undefined;

                                return (
                                  <div key={childKey} className="space-y-2">
                                    {isViewMode ? (
                                      <div className="bg-white/80 p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm">
                                        <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                                          {childField.fieldName}
                                        </div>
                                        <div className="text-gray-900 font-medium text-sm sm:text-base">
                                          {getValues(childKey) || <span className="text-gray-400 italic">Non renseigné</span>}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="bg-white/80 rounded-lg p-1 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                        <FieldRenderer
                                          field={childField}
                                          name={childKey}
                                          currentLang={currentLang}
                                          formValues={childFormValues}
                                          showControlButtons={false}
                                          dependentFieldNameTransformed={dependentFieldNameTransformed}
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={tempName} className="space-y-2">
                {isViewMode ? (
                  <div className="bg-white/80 p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                      {subField.fieldName}
                    </div>
                    <div className="text-gray-900 font-medium text-sm sm:text-base">
                      {getValues(tempName) || <span className="text-gray-400 italic">Non renseigné</span>}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/80 rounded-lg p-1 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <FieldRenderer
                      field={subField}
                      name={tempName}
                      currentLang={currentLang}
                      formValues={fieldSpecificFormValues}
                      showControlButtons={false}
                      dependentFieldNameTransformed={dependentFieldNameTransformed}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SeriesItem;