import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import type { FormField } from '../../types/formTypeStructure';

export const useRepeatGroupLogic = (field: FormField, formValues: Record<string, any>) => {
  const { getValues, setValue, watch } = useFormContext();
  const [expandedSeries, setExpandedSeries] = useState<Set<number>>(new Set());
  
  const repeatGroup = field.repeatGroup!;
  const watchedValue = watch(field.fieldName);
  const basedOnValue = Number(watchedValue) || 0;
  const filledSeries = formValues?.[repeatGroup.fieldName] ?? [];

  const buildTempFieldName = (childFieldName: string, index: number) =>
    `${repeatGroup.fieldName}_${childFieldName}_${index}`;

  const buildNestedGroupFieldName = (childGroupFieldName: string, index: number) =>
    `${repeatGroup.fieldName}_${childGroupFieldName}_${index}`;

  const buildNestedChildFieldName = (
    childGroupFieldName: string,
    index: number,
    childFieldName: string,
    nestedIndex: number
  ) => `${buildNestedGroupFieldName(childGroupFieldName, index)}_${childFieldName}_${nestedIndex}`;

  const hasFilledData = filledSeries.some((group: any) =>
    Object.values(group || {}).some((v) => v !== "" && v !== null && v !== undefined)
  );

  const toggleSeries = (index: number) => {
    const newExpanded = new Set(expandedSeries);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSeries(newExpanded);
  };

  const expandAll = () => {
    const allIndices = Array.from({ length: basedOnValue }, (_, i) => i);
    setExpandedSeries(new Set(allIndices));
  };

  const collapseAll = () => {
    setExpandedSeries(new Set());
  };

  const prefillTempFields = (series: any[]) => {
    for (let i = 0; i < basedOnValue; i++) {
      const groupData = series[i] ?? {};
      repeatGroup.formFields.forEach((subField) => {
        const fieldKey = buildTempFieldName(subField.fieldName, i);
        const currentValue = groupData[subField.fieldName];
        setValue(fieldKey, currentValue ?? "", {
          shouldValidate: true,
          shouldDirty: true,
        });

        // 🆕 Préremplir les champs "autre" si ils existent dans les données
        const otherFieldKey = `autre_${fieldKey}`;
        const otherFieldName = `autre_${subField.fieldName}`;
        if (groupData[otherFieldName] !== undefined) {
          setValue(otherFieldKey, groupData[otherFieldName] ?? "", {
            shouldValidate: true,
            shouldDirty: true,
          });
        }

        // 🆕 Préremplir les champs de détails si ils existent dans les données
        if (subField.detailInfos) {
          const parentValue = groupData[subField.fieldName];
          if (parentValue) {
            // Pour unichoix
            if (typeof parentValue === 'string') {
              const detailConfig = subField.detailInfos[parentValue];
              if (detailConfig) {
                detailConfig.formFields.forEach(detailField => {
                  const detailDataKey = `${subField.fieldName}_${parentValue}_${detailField.fieldName}`;
                  const detailFieldKey = `${fieldKey}_${parentValue}_${detailField.fieldName}`;
                  if (groupData[detailDataKey] !== undefined) {
                    setValue(detailFieldKey, groupData[detailDataKey] ?? "", {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }
                });
              }
            }
            // Pour multichoix (checkbox)
            else if (Array.isArray(parentValue)) {
              parentValue.forEach((optionValue: string) => {
                const detailConfig = subField.detailInfos[optionValue];
                if (detailConfig) {
                  detailConfig.formFields.forEach(detailField => {
                    const detailDataKey = `${subField.fieldName}_${optionValue}_${detailField.fieldName}`;
                    const detailFieldKey = `${fieldKey}_${optionValue}_${detailField.fieldName}`;
                    if (groupData[detailDataKey] !== undefined) {
                      setValue(detailFieldKey, groupData[detailDataKey] ?? "", {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }
                  });
                }
              });
            }
          }
        }

        if (subField.repeatGroup) {
          const nestedData = Array.isArray(groupData[subField.repeatGroup.fieldName])
            ? groupData[subField.repeatGroup.fieldName]
            : [];

          if ((currentValue === undefined || currentValue === null || currentValue === "") && nestedData.length > 0) {
            setValue(fieldKey, nestedData.length, {
              shouldValidate: true,
              shouldDirty: true,
            });
          }

          nestedData.forEach((nestedEntry: Record<string, any> = {}, nestedIndex: number) => {
            subField.repeatGroup!.formFields.forEach((childField) => {
              const childKey = buildNestedChildFieldName(
                subField.repeatGroup!.fieldName,
                i,
                childField.fieldName,
                nestedIndex
              );
              setValue(childKey, nestedEntry?.[childField.fieldName] ?? "", {
                shouldValidate: true,
                shouldDirty: true,
              });
            });
          });
        }
      });
    }
  };

  const saveGroups = () => {
    const groups: Record<string, any>[] = [];
    for (let i = 0; i < basedOnValue; i++) {
      const group: Record<string, any> = {};
      repeatGroup.formFields.forEach((subField) => {
        const fieldKey = buildTempFieldName(subField.fieldName, i);
        const rawValue = getValues(fieldKey);
        group[subField.fieldName] = rawValue;

        // 🆕 Sauvegarder les champs "autre" si ils existent
        const otherFieldKey = `autre_${fieldKey}`;
        const otherFieldValue = getValues(otherFieldKey);
        if (otherFieldValue !== undefined && otherFieldValue !== null && otherFieldValue !== "") {
          group[`autre_${subField.fieldName}`] = otherFieldValue;
        }

        // 🆕 Sauvegarder les champs de détails si ils existent
        if (subField.detailInfos) {
          if (subField.fieldType === 'checkbox' && Array.isArray(rawValue)) {
            // Pour multichoix : sauvegarder les détails de chaque option sélectionnée
            rawValue.forEach((optionValue: string) => {
              const detailConfig = subField.detailInfos![optionValue];
              if (detailConfig) {
                detailConfig.formFields.forEach(detailField => {
                  const detailFieldKey = `${fieldKey}_${optionValue}_${detailField.fieldName}`;
                  const detailValue = getValues(detailFieldKey);
                  if (detailValue !== undefined && detailValue !== null && detailValue !== "") {
                    group[`${subField.fieldName}_${optionValue}_${detailField.fieldName}`] = detailValue;
                  }
                });
              }
            });
          } else if (typeof rawValue === 'string' && rawValue) {
            // Pour unichoix : sauvegarder les détails de l'option sélectionnée
            const detailConfig = subField.detailInfos[rawValue];
            if (detailConfig) {
              detailConfig.formFields.forEach(detailField => {
                const detailFieldKey = `${fieldKey}_${rawValue}_${detailField.fieldName}`;
                const detailValue = getValues(detailFieldKey);
                if (detailValue !== undefined && detailValue !== null && detailValue !== "") {
                  group[`${subField.fieldName}_${rawValue}_${detailField.fieldName}`] = detailValue;
                }
              });
            }
          }
        }

        if (subField.repeatGroup) {
          const nestedCount = Math.max(0, Number(rawValue) || 0);
          const nestedEntries: Record<string, any>[] = [];

          for (let nestedIndex = 0; nestedIndex < nestedCount; nestedIndex++) {
            const nestedEntry: Record<string, any> = {};
            subField.repeatGroup.formFields.forEach((childField) => {
              const childKey = buildNestedChildFieldName(
                subField.repeatGroup!.fieldName,
                i,
                childField.fieldName,
                nestedIndex
              );
              nestedEntry[childField.fieldName] = getValues(childKey);
            });
            nestedEntries.push(nestedEntry);
          }

          group[subField.repeatGroup.fieldName] = nestedEntries;
        }
      });
      groups.push(group);
    }

    setValue(repeatGroup.fieldName, groups, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const clearGroups = () => {
    for (let i = 0; i < basedOnValue; i++) {
      repeatGroup.formFields.forEach((subField) => {
        const fieldKey = buildTempFieldName(subField.fieldName, i);
        const currentValue = getValues(fieldKey);

        // 🆕 Nettoyer les champs "autre" aussi
        const otherFieldKey = `autre_${fieldKey}`;
        setValue(otherFieldKey, "", {
          shouldValidate: true,
          shouldDirty: true,
        });

        // 🆕 Nettoyer les champs de détails aussi
        if (subField.detailInfos) {
          Object.keys(subField.detailInfos).forEach(optionValue => {
            const detailConfig = subField.detailInfos![optionValue];
            if (detailConfig) {
              detailConfig.formFields.forEach(detailField => {
                const detailFieldKey = `${fieldKey}_${optionValue}_${detailField.fieldName}`;
                setValue(detailFieldKey, "", {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              });
            }
          });
        }

        if (subField.repeatGroup) {
          const nestedCount = Math.max(0, Number(currentValue) || 0);
          for (let nestedIndex = 0; nestedIndex < nestedCount; nestedIndex++) {
            subField.repeatGroup.formFields.forEach((childField) => {
              const childKey = buildNestedChildFieldName(
                subField.repeatGroup!.fieldName,
                i,
                childField.fieldName,
                nestedIndex
              );
              setValue(childKey, "", {
                shouldValidate: true,
                shouldDirty: true,
              });
            });
          }
          setValue(buildNestedGroupFieldName(subField.repeatGroup.fieldName, i), [], {
            shouldValidate: true,
            shouldDirty: true,
          });
        }

        setValue(fieldKey, "", {
          shouldValidate: true,
          shouldDirty: true,
        });
      });
    }

    setValue(repeatGroup.fieldName, [], {
      shouldValidate: true,
      shouldDirty: true,
    });

    setValue(field.fieldName, 0, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return {
    expandedSeries,
    setExpandedSeries,
    basedOnValue,
    filledSeries,
    watchedValue,
    hasFilledData,
    repeatGroup,
    toggleSeries,
    expandAll,
    collapseAll,
    prefillTempFields,
    saveGroups,
    clearGroups,
    buildTempFieldName,
    buildNestedGroupFieldName,
    buildNestedChildFieldName,
  };
};


