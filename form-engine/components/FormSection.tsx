import React from "react";
import { getLocalizedText } from "../FormFieldWrapper";
import FieldRenderer from "../FieldRenderer";
import RepeatGroupRenderer from "../repeat-groupe-renderer/RepeatGroupRenderer";
import OTPRenderer from "./OTPRenderer";
import { shouldDisplayFormField, shouldDisplaySection } from "../types/displayRules";
import { useFormStore } from "../store/useFormStore";
import { hasOTPField, getOTPField } from "../types/formUtils";
import { useAutoOtherField } from "../hooks/useAutoOtherField";
import { useDetailInfos, type DetailInfoGroup } from "../hooks/useDetailInfos";

import H4Title from "../../text/H4Title";
import PContent from "../../text/PContent";

import type { FormField, Section, ResponseInForm, ContainerStyles } from "../types/formTypeStructure";

interface ConditionalStats {
  sectionVisible: boolean;
  visibleFields: number;
  totalFields: number;
  hiddenFields: number;
  requiredVisible: number;
  requiredHidden: number;
  hiddenFieldNames: string[];
  conditionalFields: number;
  errors?: string[];
}

interface FormSectionProps {
  section: Section;
  fields: FormField[];
  currentLang: string;
  fadeKey: number;
  formValues: Record<string, any>;
  formId?: string; // 🆕 ID du formulaire pour stocker les tokens OTP
  paginationMode?: "byFields" | "bySection";
  allSections?: Section[];
  currentSectionIndex?: number;
  debugInfo?: {
    sectionIndex: number;
    fieldPage: number;
    sectionCount: number;
    totalFieldPages: number;
    fieldsOnCurrentPage: number;
  };
  onFieldChange: (fieldName: string, value: any) => void;
  onConditionalChange?: (stats: ConditionalStats) => void;
  onConditionalError?: (error: Error, context: { section: Section; field?: FormField }) => void;
  onClearForm?: () => void;
  onSubmit?: () => void; // 🆕 Fonction pour soumettre le formulaire
  onNext?: () => void; // 🆕 Fonction pour aller à la section suivante
  isLastSection?: boolean; // 🆕 Indique si c'est la dernière section
  sectionContainerStyles?: ContainerStyles; // Styles personnalisés pour le conteneur de section
}

const FormSection: React.FC<FormSectionProps> = ({
  section,
  fields,
  currentLang,
  fadeKey,
  formValues,
  formId,
  paginationMode,
  allSections = [],
  currentSectionIndex = 0,
  debugInfo,
  onConditionalChange,
  onConditionalError,
  onClearForm,
  onSubmit,
  onNext,
  isLastSection = false,
  sectionContainerStyles,
  // onFieldChange, // ⚠️ IMPORTANT: Cette prop doit être utilisée !
}) => {
  // Log initial pour déboguer
  // console.log('1-🔍 FormSection - Début du rendu', {
  //   sectionTitle: section.title ? getLocalizedText(section.title, currentLang) : 'Sans titre',
  //   fieldsCount: fields.length,
  //   formValues,
  //   section
  // });

  // Convertir formValues en format ResponseInForm
  const allResponseInForms: Record<string, ResponseInForm> = React.useMemo(() => {
    const responses: Record<string, ResponseInForm> = {};
    
    Object.entries(formValues).forEach(([key, value]) => {
      responses[key] = { responseValue: value };
    });
    
    // console.log('2-🔄 FormSection - Conversion formValues vers ResponseInForm', {
    //   formValues,
    //   responses
    // });
    
    return responses;
  }, [formValues]);

  // 🔥 NOUVEAU : Nettoyage automatique des valeurs obsolètes (déplacé dans useEffect pour éviter setState pendant le rendu)
  React.useEffect(() => {
    // Nettoyer les valeurs obsolètes après le rendu
    const currentFields = fields.map(f => f.fieldName);
    const formStore = useFormStore.getState();
    const currentFormId = Object.keys(formStore.forms)[0];
    
    if (currentFormId) {
      const currentFormValues = formStore.forms[currentFormId] || {};
      const valuesToKeep: Record<string, any> = {};
      
      Object.entries(currentFormValues).forEach(([key, value]) => {
        if (currentFields.includes(key)) {
          valuesToKeep[key] = value;
        }
      });
      
      // Nettoyer si des valeurs obsolètes existent
      const hasObsoleteValues = Object.keys(currentFormValues).some(key => !currentFields.includes(key));
      if (hasObsoleteValues) {
        formStore.setAllFormValues(currentFormId, valuesToKeep);
        // console.log('🧹 [FormSection] Nettoyage des valeurs obsolètes');
      }
    }
  }, [fadeKey, section.sectionId, fields]);

  // 🔥 Amélioration : Clé de section plus robuste et unique
  const sectionKey = React.useMemo(() => {
    // Utiliser une combinaison de fadeKey et sectionId pour forcer le re-rendu
    // Le fadeKey inclut maintenant un compteur de changement de section
    return `section_${fadeKey}_${section.sectionId}`;
  }, [fadeKey, section.sectionId]);

  // Vérifier si la section doit être affichée avec gestion d'erreurs
  const shouldShowSection = React.useMemo(() => {
    // console.log('3-🔍 FormSection - Évaluation affichage section', {
    //   sectionTitle: section.title ? getLocalizedText(section.title, currentLang) : 'Sans titre',
    //   sectionConditionalDisplay: section.conditionalDisplay,
    //   allResponseInForms
    // });

    try {
      const result = shouldDisplaySection(section, allResponseInForms);
      
      // console.log('4-✅ FormSection - Résultat affichage section', {
      //   sectionTitle: section.title ? getLocalizedText(section.title, currentLang) : 'Sans titre',
      //   shouldShow: result,
      //   conditionalDisplay: section.conditionalDisplay
      // });
      
      return result;
    } catch (error) {
      console.error('5-❌ FormSection - Erreur évaluation section', {
        sectionTitle: section.title ? getLocalizedText(section.title, currentLang) : 'Sans titre',
        error,
        section,
        allResponseInForms
      });
      
      onConditionalError?.(error as Error, { section });
      return true; // Fallback : afficher la section en cas d'erreur
    }
  }, [section, allResponseInForms, onConditionalError, currentLang]);

  // Filtrer les champs selon leurs conditions d'affichage avec gestion d'erreurs
  const { visibleFields, evaluationErrors } = React.useMemo(() => {
    // console.log('6-🔍 FormSection - Évaluation affichage champs', {
    //   sectionTitle: section.title ? getLocalizedText(section.title, currentLang) : 'Sans titre',
    //   fieldsCount: fields.length,
    //   fields: fields.map(f => ({ 
    //     fieldName: f.fieldName, 
    //     conditionalDisplay: f.conditionalDisplay,
    //     type: f.fieldType 
    //   }))
    // });

    const errors: string[] = [];
    const visible: FormField[] = [];

    fields.forEach(field => {
      // console.log(`7-🔍 FormSection - Évaluation chaque champ "${field.fieldName}"`, {
      //   fieldName: field.fieldName,
      //   conditionalDisplay: field.conditionalDisplay,
      //   type: field.fieldType,
      //   allResponseInForms
      // });

      try {
        const shouldShow = shouldDisplayFormField(field, allResponseInForms);
        
        // console.log(`8-${shouldShow ? '✅' : '❌'} FormSection - Résultat champ "${field.fieldName}"`, {
        //   fieldName: field.fieldName,
        //   shouldShow,
        //   conditionalDisplay: field.conditionalDisplay
        // });
        
        if (shouldShow) {
          visible.push(field);
        }
      } catch (error) {
        console.error(`9-❌ FormSection - Erreur évaluation champ "${field.fieldName}"`, {
          fieldName: field.fieldName,
          error,
          field,
          allResponseInForms
        });
        
        errors.push(`Field ${field.fieldName}: ${(error as Error).message}`);
        onConditionalError?.(error as Error, { section, field });
        // Fallback : afficher le champ en cas d'erreur
        visible.push(field);
      }
    });

    // console.log('10-📊 FormSection - Résumé évaluation champs', {
    //   sectionTitle: section.title ? getLocalizedText(section.title, currentLang) : 'Sans titre',
    //   totalFields: fields.length,
    //   visibleFields: visible.length,
    //   hiddenFields: fields.length - visible.length,
    //   visibleFieldNames: visible.map(f => f.fieldName),
    //   hiddenFieldNames: fields.filter(f => !visible.some(v => v.fieldName === f.fieldName)).map(f => f.fieldName),
    //   errors
    // });

    return { 
      visibleFields: visible,
      evaluationErrors: errors
    };
  }, [fields, allResponseInForms, section, onConditionalError, currentLang]);

  // 🆕 Générer automatiquement les champs "autre" pour dropdown/radio/checkbox
  const autoOtherFields = useAutoOtherField(visibleFields, currentLang);

  // 🆕 Générer automatiquement les groupes de champs de détails
  const detailInfosGroups = useDetailInfos(visibleFields, currentLang);

  // 🆕 Injecter les champs "autre" et les groupes de détails immédiatement après leurs champs parents
  const fieldsWithAutoOtherAndDetails = React.useMemo(() => {
    const result: Array<FormField | { type: 'detail-group', group: DetailInfoGroup }> = [];
    
    visibleFields.forEach(field => {
      // Ajouter le champ parent
      result.push(field);
      
      // Si un champ "autre" existe pour ce champ parent, l'ajouter immédiatement après
      const otherField = autoOtherFields[field.fieldName];
      if (otherField) {
        result.push(otherField);
      }
      
      // Si des groupes de détails existent pour ce champ parent, les ajouter
      const detailGroups = detailInfosGroups[field.fieldName];
      if (detailGroups && detailGroups.length > 0) {
        detailGroups.forEach(group => {
          result.push({ type: 'detail-group', group });
        });
      }
    });
    
    return result;
  }, [visibleFields, autoOtherFields, detailInfosGroups]);

  // Statistiques pour le debug et les callbacks
  const fieldStats = React.useMemo(() => {
    const totalFields = fields.length;
    const visibleFieldsCount = visibleFields.length;
    const hiddenFields = fields.filter(field => 
      !visibleFields.some(vf => vf.fieldName === field.fieldName)
    );
    
    const requiredVisibleFields = visibleFields.filter(field => 
      field.validations?.some(v => v.validationType === "required")
    );
    
    const requiredHiddenFields = hiddenFields.filter(field => 
      field.validations?.some(v => v.validationType === "required")
    );

    const stats: ConditionalStats = {
      sectionVisible: shouldShowSection,
      totalFields,
      visibleFields: visibleFieldsCount,
      hiddenFields: hiddenFields.length,
      requiredVisible: requiredVisibleFields.length,
      requiredHidden: requiredHiddenFields.length,
      hiddenFieldNames: hiddenFields.map(f => f.fieldName),
      conditionalFields: fields.filter(f => f.conditionalDisplay).length,
      errors: evaluationErrors.length > 0 ? evaluationErrors : undefined
    };

    // console.log('11-📊 FormSection - Statistiques finales', {
    //   sectionTitle: section.title ? getLocalizedText(section.title, currentLang) : 'Sans titre',
    //   stats
    // });

    return stats;
  }, [fields, visibleFields, shouldShowSection, evaluationErrors, section.title, currentLang]);

  // Déclencher le callback de changement conditionnel
  React.useEffect(() => {
    // console.log('12-🔄 FormSection - Déclenchement callback conditional change', {
    //   sectionTitle: section.title ? getLocalizedText(section.title, currentLang) : 'Sans titre',
    //   fieldStats
    // });
    
    onConditionalChange?.(fieldStats);
  }, [fieldStats, onConditionalChange, section.title, currentLang]);

  // Fonction pour déterminer les classes CSS selon la largeur du champ
  const getFieldWidthClass = (field: FormField): string => {
    const width = field.width || "half"; // Par défaut "half" si non spécifiée
    
    if (width === "full") {
      return "col-span-1 tablet:col-span-2 w-full"; // Full width sur tous les écrans
    } else {
      return "col-span-1 w-full"; // Half width (1 colonne mobile, 2 colonnes tablet+)
    }
  };

  const renderFieldOrRepeat = (field: FormField) => {
    // console.log(`13-🎨 FormSection - Rendu champ "${field.fieldName}"`, {
    //   fieldName: field.fieldName,
    //   type: field.fieldType,
    //   hasRepeatGroup: !!field.repeatGroup,
    //   hasRepeatRule: !!field.repeatRule
    // });

    // Clé unique qui inclut la section et le fadeKey pour forcer le re-rendu
    const uniqueKey = `${fadeKey}_${field.fieldName}`;

    if (field.repeatGroup && field.repeatRule) {
      return (
        <RepeatGroupRenderer
          key={uniqueKey}
          field={field}
          formValues={formValues}
          currentLang={currentLang}
          // onFieldChange={onFieldChange} // ⚠️ IMPORTANT: Passer la prop !
        />
      );
    }

    return (
      <FieldRenderer
        key={uniqueKey}
        field={field}
        currentLang={currentLang}
        formValues={formValues}
        // onFieldChange={onFieldChange} // ⚠️ IMPORTANT: Passer la prop !
      />
    );
  };

  // Si la section ne doit pas être affichée, ne rien rendre
  if (!shouldShowSection) {
    // console.log('14-🚫 FormSection - Section cachée', {
    //   sectionTitle: section.title ? getLocalizedText(section.title, currentLang) : 'Sans titre',
    //   shouldShowSection,
    //   debugInfo: !!debugInfo
    // });

    return debugInfo ? (
      <div className="border-2 border-red-200 w-full max-w-4xl bg-red-50 rounded-lg p-4 opacity-50">
        <div className="text-red-600 text-sm">
          ⚠️ Section cachée par les conditions d'affichage
        </div>

        {section?.title && (
          <div className="text-xs text-red-500 mt-2">
            Section: {section.title ? getLocalizedText(section.title, currentLang) : 'Sans titre'}
          </div>
        )}

        {evaluationErrors.length > 0 && (
          <div className="text-xs text-red-600 mt-2 bg-red-100 p-2 rounded">
            <div className="font-medium">Erreurs d'évaluation:</div>
            {evaluationErrors.map((error, index) => (
              <div key={index} className="ml-2">• {error}</div>
            ))}
          </div>
        )}
      </div>
    ) : null;
  }

  // 🆕 Détecter si la section contient un champ OTP
  const otpField = React.useMemo(() => {
    const field = getOTPField(section);
    if (field) {
      // console.log("🔍 [FormSection] OTP Field détecté:", field.fieldName);
    }
    return field;
  }, [section]);

  // Styles par défaut pour le conteneur de section (utilisés aussi pour OTP)
  const defaultBorderColor = '#e2e8f0'; // slate-200
  const defaultBorderWidth = '2px';
  const defaultBackgroundColor = '#F6F6F6';

  // Appliquer les styles personnalisés ou utiliser les valeurs par défaut
  const sectionBorderColor = sectionContainerStyles?.borderColor || defaultBorderColor;
  const sectionBorderWidth = sectionContainerStyles?.borderWidth 
    ? (typeof sectionContainerStyles.borderWidth === 'number' 
        ? `${sectionContainerStyles.borderWidth}px` 
        : sectionContainerStyles.borderWidth)
    : defaultBorderWidth;
  const sectionBackgroundColor = sectionContainerStyles?.backgroundColor || defaultBackgroundColor;

  // 🆕 Si la section contient un OTP, afficher uniquement OTPRenderer
  if (otpField) {
    // console.log("✅ [FormSection] Affichage de OTPRenderer pour:", otpField.fieldName);
    return (
      <div
        key={sectionKey}
        className="w-full max-w-4xl rounded-lg p-2 tablet:p-8 flex flex-col items-center"
        style={{
          borderColor: sectionBorderColor,
          borderWidth: sectionBorderWidth,
          borderStyle: 'solid',
          backgroundColor: sectionBackgroundColor,
        }}
      >
        {/* Header de la section */}
        {section.title && (
          <div className="w-full mb-6">
            <H4Title className="text-center mb-2">
              {getLocalizedText(section.title, currentLang)}
            </H4Title>
            {section.subTitle && (
              <PContent className="text-center text-gray-600">
                {getLocalizedText(section.subTitle, currentLang)}
              </PContent>
            )}
          </div>
        )}

        {/* Afficher uniquement OTPRenderer */}
        <OTPRenderer
          field={otpField}
          formValues={formValues}
          formId={formId}
          currentLang={currentLang}
          onClearForm={onClearForm || (() => {
            console.warn("onClearForm not provided, using fallback");
            // Fallback: réinitialiser les valeurs du formulaire
            const formStore = useFormStore.getState();
            const currentFormId = Object.keys(formStore.forms)[0];
            if (currentFormId) {
              formStore.clearForm(currentFormId);
            }
          })}
          allSections={allSections}
          onSubmit={onSubmit}
          onNext={onNext}
          isLastSection={isLastSection}
        />
      </div>
    );
  }

  // Si aucun champ n'est visible, ne pas afficher la section
  if (visibleFields.length === 0) {
    // console.log('15-🚫 FormSection - Section visible mais aucun champ visible', {
    //   sectionTitle: section.title ? getLocalizedText(section.title, currentLang) : 'Sans titre',
    //   shouldShowSection,
    //   visibleFieldsCount: visibleFields.length,
    //   totalFields: fields.length,
    //   debugInfo: !!debugInfo
    // });

    return debugInfo ? (
      <div className="border-2 border-orange-200 w-full max-w-4xl bg-orange-50 rounded-lg p-4 opacity-50">
        <div className="text-orange-600 text-sm">
          ⚠️ Section visible mais tous les champs sont cachés ({fieldStats.totalFields} champs)
        </div>
        <div className="text-xs text-orange-500 mt-2">
          Champs cachés: {fieldStats.hiddenFieldNames.join(', ')}
        </div>
        {evaluationErrors.length > 0 && (
          <div className="text-xs text-orange-600 mt-2 bg-orange-100 p-2 rounded">
            <div className="font-medium">Erreurs d'évaluation:</div>
            {evaluationErrors.map((error, index) => (
              <div key={index} className="ml-2">• {error}</div>
            ))}
          </div>
        )}
      </div>
    ) : null;
  }

  // console.log('16-✅ FormSection - Rendu section avec champs visibles', {
  //   sectionTitle: section.title ? getLocalizedText(section.title, currentLang) : 'Sans titre',
  //   visibleFieldsCount: visibleFields.length,
  //   visibleFieldNames: visibleFields.map(f => f.fieldName)
  // });

  return (
    <div
      key={sectionKey}
      className="w-full max-w-4xl rounded-lg p-2 tablet:p-8 flex flex-col items-center"
      style={{
        borderColor: sectionBorderColor,
        borderWidth: sectionBorderWidth,
        borderStyle: 'solid',
        backgroundColor: sectionBackgroundColor,
      }}
    >
      {/* 🔥 Composant de nettoyage automatique */}
      
      {section.title && (
        <H4Title className="text-lg font-medium text-gray-700 mb-4 pb-2 border-b border-gray-200 w-full">
          {getLocalizedText(section.title, currentLang)}
        </H4Title>
      )}

      {section.subTitle && (
        <PContent className="text-gray-600 mb-4 w-full">
          {getLocalizedText(section.subTitle, currentLang)}
        </PContent>
      )}

      <div className="grid grid-cols-1 tablet:grid-cols-2 gap-6 w-full [&_input:not([type='radio']):not([type='checkbox'])]:!w-full [&_textarea]:!w-full [&_select]:!w-full [&_*]:!max-w-full">
        {fieldsWithAutoOtherAndDetails.map((item, index) => {
          // Vérifier si c'est un groupe de détails
          if ('type' in item && item.type === 'detail-group') {
            const { group } = item;
            return (
              <div
                key={`${fadeKey}_detail-group_${group.optionValue}_${index}`}
                className="col-span-1 tablet:col-span-2 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                {group.groupLabel && (
                  <h4 className="font-semibold text-gray-700 mb-3 text-sm">
                    {group.groupLabel}
                  </h4>
                )}
                <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
                  {group.fields.map((detailField) => (
                    <div
                      key={`${fadeKey}_${detailField.fieldName}_wrapper`}
                      className={getFieldWidthClass(detailField)}
                    >
                      {renderFieldOrRepeat(detailField)}
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          
          // C'est un champ normal
          const field = item as FormField;
          return (
            <div 
              key={`${fadeKey}_${field.fieldName}_wrapper`} 
              className={getFieldWidthClass(field)}
            >
              {renderFieldOrRepeat(field)}
            </div>
          );
        })}
      </div>

      {/* {debugInfo && (
        <div className="mt-4 text-xs text-gray-600 border-t pt-4 w-full bg-gray-50 rounded-md p-3">
          <div className="flex flex-col gap-2">
            <p>
              Section {debugInfo.sectionIndex + 1}/{debugInfo.sectionCount}
            </p>
            <p>
              Page {debugInfo.fieldPage + 1}/{debugInfo.totalFieldPages} — Champs affichés : {visibleFields.length}
            </p>
            <p className="text-green-600">
              Champs visibles : {visibleFields.length}/{fields.length}
            </p>
            {fieldStats.requiredHidden > 0 && (
              <p className="text-yellow-600">
                ⚠️ Champs obligatoires cachés : {fieldStats.requiredHidden}
              </p>
            )}
            {fieldStats.conditionalFields > 0 && (
              <p className="text-blue-600">
                Champs avec conditions : {fieldStats.conditionalFields}
              </p>
            )}
            {evaluationErrors.length > 0 && (
              <div className="text-red-600 bg-red-50 p-2 rounded mt-2">
                <div className="font-medium">Erreurs d'évaluation ({evaluationErrors.length}):</div>
                {evaluationErrors.map((error, index) => (
                  <div key={index} className="ml-2 text-xs">• {error}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )} */}
    </div>
  );
};

export default FormSection;