import { useCallback, useEffect, useMemo } from "react";
import { useFormNavigation } from "../../hooks/useFormNavigation";
import type { FormEngineProps } from "./types/formEngine.types";
import { extractAllFields } from "../../types/formUtils";
import { useFormPersistence, useFormStore } from "../../store/useFormStore";
import { createZodSchema } from "../../types/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { shouldDisplaySection, shouldDisplayFormField } from "../../types/displayRules";
import type { ResponseInForm } from "../../types/formTypeStructure";
import useFormReset from "./hooks/useFormReset";
import FormEngineContent from "./FormEngineContent";

// import { useFormToast, FormToastUtils } from './toast/FormToastNotifier';



const FormEngine: React.FC<FormEngineProps> = ({
  form,
  formId,
  onSubmit,
  currentLang = "fr",
  submitButtonText,
  paginationMode // Prop optionnelle pour override (priorité sur form.layoutOptions)
}) => {
  // Déterminer le mode de pagination : prop > form.layoutOptions > défaut
  const effectivePaginationMode = paginationMode ?? form.layoutOptions?.paginationMode ?? "byFields";
  // Extraire progressBarType depuis form.layoutOptions
  const progressBarType = form.layoutOptions?.progressBarType;
  // Extraire headerOptions depuis form.layoutOptions
  const headerOptions = form.layoutOptions?.headerOptions;
  // Extraire displayDeleteButton depuis form.layoutOptions (défaut: true pour rétrocompatibilité)
  const displayDeleteButton = form.layoutOptions?.displayDeleteButton ?? true;
  // Extraire containerStyles depuis form.layoutOptions
  const containerStyles = form.layoutOptions?.containerStyles;
  // Récupération des valeurs du formulaire pour calculer la visibilité
  const rawFormValues = useFormStore((state) => state.forms[formId]);
  const formValues = useMemo(() => rawFormValues ?? {}, [rawFormValues]);

  // Conversion des valeurs pour l'évaluation des conditions d'affichage
  const allResponseInForms: Record<string, ResponseInForm> = useMemo(() => {
    const responses: Record<string, ResponseInForm> = {};
    Object.entries(formValues).forEach(([key, value]) => {
      responses[key] = { responseValue: value };
    });
    return responses;
  }, [formValues]);

  // Calcul de la visibilité de chaque section
  const sectionVisibility = useMemo(() => {
    return form.sections.map((section) => {
      try {
        return shouldDisplaySection(section, allResponseInForms);
      } catch (error) {
        console.error('[FormEngine] Erreur évaluation section', { 
          sectionId: section.sectionId, 
          error 
        });
        return true; // Fallback : afficher la section en cas d'erreur
      }
    });
  }, [form.sections, allResponseInForms]);

  // Calcul de la visibilité de chaque page (basé sur les champs visibles)
  const fieldsPerPage = 4; // Valeur par défaut, peut être ajustée
  const pageVisibility = useMemo(() => {
    return form.sections.map((section, sectionIdx) => {
      if (!sectionVisibility[sectionIdx]) {
        return []; // Section cachée = aucune page visible
      }

      const fields = section.formFields || [];
      const totalPages = Math.ceil(fields.length / fieldsPerPage);
      const pageCounts = new Array(totalPages).fill(0);

      fields.forEach((field, index) => {
        const pageIndex = Math.floor(index / fieldsPerPage);
        try {
          if (shouldDisplayFormField(field, allResponseInForms)) {
            pageCounts[pageIndex] = (pageCounts[pageIndex] || 0) + 1;
          }
        } catch (error) {
          console.error('[FormEngine] Erreur évaluation champ', {
            sectionId: section.sectionId,
            fieldName: field.fieldName,
            error,
          });
          pageCounts[pageIndex] = (pageCounts[pageIndex] || 0) + 1; // Fallback
        }
      });

      return pageCounts;
    });
  }, [form.sections, sectionVisibility, allResponseInForms, fieldsPerPage]);

  // Navigation et champs
  const navigation = useFormNavigation({ 
    form, 
    paginationMode: effectivePaginationMode,
    sectionVisibility,
    pageVisibility
  });
  const allFields = useMemo(() => extractAllFields(form), [form]);

  // Persistance et schéma
  const { savedValues } = useFormPersistence(formId, form.sections);
  const schema = useMemo(() => createZodSchema(allFields), [allFields]);

  // 🔥 Amélioration : Clé unique pour forcer le re-rendu complet lors du changement de structure
  const formKey = useMemo(() => {
    // Combiner l'ID du formulaire avec le fadeKey de navigation pour forcer le re-rendu
    return `${formId}_${navigation.fadeKey}_${form.sections.length}`;
  }, [formId, navigation.fadeKey, form.sections.length]);

  // Configuration React Hook Form
  const methods = useForm({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: useMemo(() => Object.fromEntries(
      allFields.map((field) => [
        field.fieldName,
        savedValues[field.fieldName] ?? field.response?.responseValue ?? ""
      ])
    ), [allFields, savedValues]),
  });

  // Initialisation des valeurs
  useEffect(() => {
    const values = methods.getValues();
    
    for (const key in values) {
      const value = values[key];
      if (value !== undefined && value !== "") {
        methods.setValue(key, value, { shouldTouch: true });
      }
    }
  }, [methods]);

  // Gestionnaires d'événements
  const handleFieldChange = useCallback((id: string, value: any) => {
    methods.setValue(id, value, { shouldValidate: true });
  }, [methods]);

  const { handleClearAll } = useFormReset(methods, allFields, formId, navigation);

  return (
    <FormProvider {...methods}>
      <form
        key={formKey} // 🔥 Utiliser la clé unique pour forcer le re-rendu
        onSubmit={(e) => e.preventDefault()}
        className="h-full w-full laptop:w-[90%] flex flex-col items-center justify-center bg-white"
      >
        <FormEngineContent
          form={form}
          formId={formId}
          onSubmit={onSubmit}
          currentLang={currentLang}
          navigation={navigation}
          allFields={allFields}
          handleFieldChange={handleFieldChange}
          onClearAll={handleClearAll}
          methods={methods}
          submitButtonText={submitButtonText ?? "Continer"}
          paginationMode={effectivePaginationMode}
          progressBarType={progressBarType}
          sections={form.sections}
          headerOptions={headerOptions}
          displayDeleteButton={displayDeleteButton}
          containerStyles={containerStyles}
        />
      </form>
    </FormProvider>
  );
};

export default FormEngine;