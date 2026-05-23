import React, { useState, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { X, Eye, Edit, Save, Plus, ChevronDown, ChevronUp } from "lucide-react";
import FieldRenderer from "./FieldRenderer";
import type { FormField } from "./types/formTypeStructure";

interface RepeatGroupRendererProps {
  field: FormField; // le champ contenant repeatRule ET repeatGroup
  formValues: Record<string, any>;
  currentLang?: string;
}

const RepeatGroupRenderer: React.FC<RepeatGroupRendererProps> = ({
  field,
  formValues,
  currentLang = "fr",
}) => {
  const { getValues, setValue, watch } = useFormContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  
  // État pour gérer les séries ouvertes/fermées
  const [expandedSeries, setExpandedSeries] = useState<Set<number>>(new Set());
  
  // Refs pour les animations GSAP
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const seriesRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const repeatGroup = field.repeatGroup!;
  const basedOnValue = Number(getValues(field.fieldName)) || 0;
  const filledSeries = formValues?.[repeatGroup.fieldName] ?? [];

  const buildTempFieldName = (childFieldName: string, index: number) =>
    `${repeatGroup.fieldName}_${childFieldName}_${index}`;

  const buildNestedGroupFieldName = (childGroupFieldName: string, index: number) =>
    `${repeatGroup.fieldName}_${childGroupFieldName}_${index}`;

  // Watch pour déclencher automatiquement
  const watchedValue = watch(field.fieldName);

  const hasFilledData = filledSeries.some((group: any) =>
    Object.values(group || {}).some((v) => v !== "" && v !== null && v !== undefined)
  );

  // Effet pour déclencher automatiquement l'ouverture
  useEffect(() => {
    const currentValue = Number(watchedValue) || 0;
    
    if (currentValue > 0 && !hasFilledData && !isModalOpen) {
      // Petit délai pour que l'utilisateur voie le changement
      setTimeout(() => {
        openModal(false);
      }, 300);
    } else if (currentValue === 0) {
      closeModal();
    }
  }, [watchedValue, hasFilledData, isModalOpen]);

  // Initialiser les séries ouvertes quand la modal s'ouvre
  useEffect(() => {
    if (isModalOpen) {
      // Ouvrir toutes les séries par défaut
      setExpandedSeries(new Set(Array.from({ length: basedOnValue }, (_, i) => i)));
    }
  }, [isModalOpen, basedOnValue]);

  const toggleSeries = (index: number) => {
    const newExpanded = new Set(expandedSeries);
    const seriesElement = seriesRefs.current[index];
    
    if (newExpanded.has(index)) {
      // Fermer la série
      newExpanded.delete(index);
      
      // Animation de fermeture
      if (seriesElement) {
        const h = seriesElement.scrollHeight;
        const anim = seriesElement.animate(
          [{ height: `${h}px`, opacity: '1' }, { height: '0px', opacity: '0' }],
          { duration: 300, easing: 'ease-in-out', fill: 'forwards' }
        );
        anim.onfinish = () => setExpandedSeries(newExpanded);
      }
    } else {
      // Ouvrir la série
      newExpanded.add(index);
      setExpandedSeries(newExpanded);

      if (seriesElement) {
        const targetHeight = seriesElement.scrollHeight;
        const anim = seriesElement.animate(
          [{ height: '0px', opacity: '0' }, { height: `${targetHeight}px`, opacity: '1' }],
          { duration: 300, easing: 'ease-out', fill: 'forwards' }
        );
        anim.onfinish = () => { seriesElement.style.height = 'auto'; };
      }
    }
  };

  const expandAll = () => {
    const allIndices = Array.from({ length: basedOnValue }, (_, i) => i);
    setExpandedSeries(new Set(allIndices));

    allIndices.forEach((index, i) => {
      const el = seriesRefs.current[index];
      if (el && !expandedSeries.has(index)) {
        const targetHeight = el.scrollHeight;
        const anim = el.animate(
          [{ height: '0px', opacity: '0' }, { height: `${targetHeight}px`, opacity: '1' }],
          { duration: 300, delay: i * 100, easing: 'ease-out', fill: 'forwards' }
        );
        anim.onfinish = () => { el.style.height = 'auto'; };
      }
    });
  };

  const collapseAll = () => {
    expandedSeries.forEach((index, i) => {
      const el = seriesRefs.current[index];
      if (el) {
        const h = el.scrollHeight;
        el.animate(
          [{ height: `${h}px`, opacity: '1' }, { height: '0px', opacity: '0' }],
          { duration: 300, delay: i * 100, easing: 'ease-in-out', fill: 'forwards' }
        );
      }
    });
    setExpandedSeries(new Set());
  };

  const openModal = (viewMode: boolean = false) => {
    setIsViewMode(viewMode);
    setIsModalOpen(true);

    if (overlayRef.current && contentRef.current) {
      overlayRef.current.animate(
        [{ opacity: '0' }, { opacity: '1' }],
        { duration: 150, easing: 'ease-out', fill: 'forwards' }
      );
      contentRef.current.animate(
        [
          { opacity: '0', transform: 'scale(0.9) translateY(20px)' },
          { opacity: '1', transform: 'scale(1) translateY(0px)' },
        ],
        { duration: 200, delay: 50, easing: 'ease-out', fill: 'forwards' }
      );
    }
  };

  const closeModal = () => {
    if (!contentRef.current || !overlayRef.current) return;

    const contentAnim = contentRef.current.animate(
      [
        { opacity: '1', transform: 'scale(1) translateY(0px)' },
        { opacity: '0', transform: 'scale(0.9) translateY(20px)' },
      ],
      { duration: 150, easing: 'ease-in', fill: 'forwards' }
    );
    overlayRef.current.animate(
      [{ opacity: '1' }, { opacity: '0' }],
      { duration: 100, delay: 50, easing: 'ease-in', fill: 'forwards' }
    );
    contentAnim.onfinish = () => {
      setIsModalOpen(false);
      setIsViewMode(false);
      setExpandedSeries(new Set());
    };
  };

  const openEdit = () => {
    prefillTempFields(filledSeries);
    openModal(false);
  };

  const openView = () => {
    prefillTempFields(filledSeries);
    openModal(true);
  };

  const prefillTempFields = (series: any[]) => {
    for (let i = 0; i < basedOnValue; i++) {
      const groupData = series[i] ?? {};
      repeatGroup.formFields.forEach((subField) => {
        const key = buildTempFieldName(subField.fieldName, i);
        const currentValue = groupData[subField.fieldName];
        setValue(key, currentValue ?? "");

        if (subField.repeatGroup) {
          const nestedData = Array.isArray(groupData[subField.repeatGroup.fieldName])
            ? groupData[subField.repeatGroup.fieldName]
            : [];

          if ((currentValue === undefined || currentValue === null || currentValue === "") && nestedData.length > 0) {
            setValue(key, nestedData.length);
          }

          nestedData.forEach((nestedEntry: Record<string, any> = {}, nestedIndex: number) => {
            subField.repeatGroup!.formFields.forEach((childField) => {
              const childKey = `${buildNestedGroupFieldName(subField.repeatGroup!.fieldName, i)}_${childField.fieldName}_${nestedIndex}`;
              setValue(childKey, nestedEntry?.[childField.fieldName] ?? "");
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
        const countKey = buildTempFieldName(subField.fieldName, i);
        const rawValue = getValues(countKey);
        group[subField.fieldName] = rawValue;
        setValue(countKey, "");

        if (subField.repeatGroup) {
          const nestedCount = Math.max(0, Number(rawValue) || 0);
          const nestedEntries: Record<string, any>[] = [];

          for (let nestedIndex = 0; nestedIndex < nestedCount; nestedIndex++) {
            const nestedEntry: Record<string, any> = {};
            subField.repeatGroup.formFields.forEach((childField) => {
              const childKey = `${buildNestedGroupFieldName(subField.repeatGroup!.fieldName, i)}_${childField.fieldName}_${nestedIndex}`;
              nestedEntry[childField.fieldName] = getValues(childKey);
              setValue(childKey, "");
            });
            nestedEntries.push(nestedEntry);
          }

          group[subField.repeatGroup.fieldName] = nestedEntries;
        }
      });
      groups.push(group);
    }

    setValue(repeatGroup.fieldName, groups);
    closeModal();
  };

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  return (
    <div className="space-y-6">
      {/* Le champ qui déclenche le repeat */}
      <FieldRenderer
        field={field}
        currentLang={currentLang}
        formValues={formValues}
        showControlButtons={true}
        hasFilledData={hasFilledData}
        onOpenModal={() => openModal(false)}
        onOpenEdit={openEdit}
        onOpenView={openView}
      />

      {/* Modal optimisée pour mobile avec couleur principale */}
      {isModalOpen && (
        <div 
          ref={modalRef}
          className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 "
          style={{ display: "none" }}
        >
          {/* Overlay avec blur */}
          <div 
            ref={overlayRef}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />
          
          {/* Modal Content - Responsive */}
          <div 
            ref={contentRef}
            className="relative bg-white w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header avec couleur principale #008080 */}
            <div className="bg-gradient-to-r from-[#008080] to-[#006666] p-4 sm:p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
                    {isViewMode ? (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : hasFilledData ? (
                      <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold">
                      {isViewMode ? "Visualisation" : hasFilledData ? "Modifier" : "Remplir"} {repeatGroup.fieldName}
                    </h3>
                    <p className="text-teal-100 text-xs sm:text-sm">
                      {basedOnValue} série{basedOnValue > 1 ? 's' : ''} à {isViewMode ? 'visualiser' : 'compléter'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeModal?.();
                  }}
                  // onClick={closeModal}
                  className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
              
              {/* Contrôles pour ouvrir/fermer toutes les séries */}
              <div className="mt-4 flex space-x-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    expandAll?.();
                  }}
                  // onClick={expandAll}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                >
                  <ChevronDown className="h-3 w-3" />
                  <span>Tout ouvrir</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    collapseAll?.();
                  }}
                  // onClick={collapseAll}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                >
                  <ChevronUp className="h-3 w-3" />
                  <span>Tout fermer</span>
                </button>
              </div>
            </div>

            {/* Body avec scroll personnalisé - Optimisé mobile */}
            <div className="p-3 sm:p-6 max-h-[calc(95vh-200px)] sm:max-h-[calc(90vh-240px)] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                {Array.from({ length: basedOnValue }, (_, index) => (
                  <div
                    key={index}
                    className="group relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg sm:rounded-xl border border-gray-200 hover:border-[#008080] transition-all duration-300 overflow-hidden"
                  >
                    {/* Header cliquable de la série */}
                    <button
                      type="button"
                        onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleSeries(index);
                    }}
                      // onClick={() => toggleSeries(index)}
                      className="w-full p-4 sm:p-6 flex items-center justify-between bg-white/50 hover:bg-white/70 transition-colors border-b border-gray-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-[#008080] to-[#006666] text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
                          Série {index + 1}
                        </div>
                        <span className="text-sm text-gray-600 font-medium">
                          {expandedSeries.has(index) ? 'Cliquez pour fermer' : 'Cliquez pour ouvrir'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-[#008080]">
                        {expandedSeries.has(index) ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    </button>
                    
                    {/* Contenu de la série (collapsible) */}
                    <div
                      ref={el => { seriesRefs.current[index] = el; }}
                      className={`${!expandedSeries.has(index) ? 'h-0 opacity-0' : ''} overflow-hidden`}
                    >
                      <div className="p-4 sm:p-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                        {repeatGroup.formFields.map((subField) => {
                          const tempName = buildTempFieldName(subField.fieldName, index);
                          const existingGroupData = filledSeries[index] ?? {};

                          // 🆕 Calculer le nom transformé du champ parent si dynamicFilterRule existe
                          const dependentFieldNameTransformed = subField.dynamicFilterRule
                            ? buildTempFieldName(subField.dynamicFilterRule.dependentFieldName, index)
                            : undefined;
                          
                          // Debug logs - toujours afficher pour diagnostiquer
                          // console.log('🔍 [RepeatGroupRenderer] Calcul dependentFieldNameTransformed:', {
                            // fieldName: subField.fieldName,
                            // hasDynamicFilterRule: !!subField.dynamicFilterRule,
                            // dependentFieldName: subField.dynamicFilterRule?.dependentFieldName,
                            // repeatGroupName: repeatGroup.fieldName,
                            // index,
                            // dependentFieldNameTransformed,
                            // tempName,
                            // fieldType: subField.fieldType
                          // });

                          if (subField.repeatGroup && subField.repeatRule) {
                            const nestedGroupBaseName = buildNestedGroupFieldName(subField.repeatGroup.fieldName, index);
                            const nestedCount = Math.max(0, Number(watch(tempName)) || 0);
                            const existingNestedData = Array.isArray(existingGroupData[subField.repeatGroup.fieldName])
                              ? existingGroupData[subField.repeatGroup.fieldName]
                              : [];

                            return (
                              <div key={`${tempName}_nested`} className="space-y-4 sm:col-span-2">
                                <div className="bg-white/80 rounded-lg p-1 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                  <FieldRenderer
                                    field={subField}
                                    name={tempName}
                                    currentLang={currentLang}
                                    formValues={{ ...formValues, [tempName]: existingGroupData[subField.fieldName] ?? "" }}
                                    showControlButtons={false}
                                    dependentFieldNameTransformed={dependentFieldNameTransformed}
                                  />
                                </div>

                                {nestedCount > 0 && (
                                  <div className="space-y-3">
                                    {Array.from({ length: nestedCount }, (_, nestedIndex) => {
                                      const nestedEntry = existingNestedData[nestedIndex] ?? {};
                                      return (
                                        <div
                                          key={`${nestedGroupBaseName}_row_${nestedIndex}`}
                                          className="border border-teal-200 rounded-lg bg-white/70 shadow-sm"
                                        >
                                          <div className="px-3 sm:px-4 py-2 bg-teal-50 border-b border-teal-100 text-sm sm:text-base font-semibold text-teal-700">
                                            {currentLang === 'fr' ? `Dépendant ${nestedIndex + 1}` : `Dependant ${nestedIndex + 1}`}
                                          </div>
                                          <div className="p-3 sm:p-4 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                                            {subField.repeatGroup.formFields.map((childField) => {
                                              const childKey = `${nestedGroupBaseName}_${childField.fieldName}_${nestedIndex}`;
                                              const childFormValues = {
                                                ...formValues,
                                                [childKey]: nestedEntry?.[childField.fieldName] ?? "",
                                              };

                                              // 🆕 Calculer le nom transformé du champ parent pour les nested groups
                                              // Pattern: {nestedGroupBaseName}_{dependentFieldName}_{nestedIndex}
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

                          const fieldSpecificFormValues = {
                            ...formValues,
                            [tempName]: existingGroupData[subField.fieldName] ?? "",
                          };

                          return (
                            <div key={tempName} className="space-y-2 ">
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
                                <div className="bg-white/80  rounded-lg p-1 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
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
                ))}
              </div>
            </div>

            {/* Footer moderne - Optimisé mobile */}
            <div className="bg-gray-50 border-t border-gray-200 p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeModal?.();
                  }}
                  // onClick={closeModal}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
                >
                  {isViewMode ? "Fermer" : "Annuler"}
                </button>
                {!isViewMode && (
                  <button
                    type="button"
                    onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    saveGroups?.();
                  }}
                    // onClick={saveGroups}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2.5 bg-gradient-to-r from-[#008080] to-[#006666] text-white rounded-lg hover:from-[#007070] hover:to-[#005555] transition-all font-medium shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <Save className="h-4 w-4" />
                    <span>Sauvegarder</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepeatGroupRenderer;