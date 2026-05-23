import { useMemo, useEffect } from "react";
import { useFormStore } from "../../store/useFormStore";
import useFormNavigationActions from "./hooks/useFormNavigationActions";
import useFormPageValidation from "./hooks/useFormPageValidation";
import useFormSubmission from "./hooks/useFormSubmission";
import { useSectionDynamicFiltering } from "../../hooks/useDynamicFiltering";
import type { FormEngineContentProps } from "./types/formEngine.types";
import FormSyncComponent from "./FormSyncComponent";
import FormProgressBar from "../FormProgressBar";
import FormHeader from "../FormHeader";
import FormSection from "../FormSection";
import FormNavigation from "../FormNavigation";


const FormEngineContent: React.FC<FormEngineContentProps> = ({
  form,
  formId,
  onSubmit,
  currentLang,
  navigation,
  handleFieldChange,
  onClearAll,
  methods,
  submitButtonText,
  paginationMode,
  progressBarType,
  sections,
  headerOptions,
  displayDeleteButton = true,
  containerStyles,
}) => {
  // Récupération des valeurs du formulaire
  const rawFormValues = useFormStore((state) => state.forms[formId]);
  const formValues = useMemo(() => rawFormValues ?? {}, [rawFormValues]);

  // Hooks personnalisés pour séparer les responsabilités
  const { validatePage, isValidating, setIsValidating } = useFormPageValidation(
    navigation,
    methods,
    currentLang,
    paginationMode
  );
  const { handleNext } = useFormNavigationActions(
    navigation,
    validatePage,
    isValidating,
    setIsValidating,
    form,
    formValues,
    paginationMode || "byFields"
  );
  const { handleSubmitWithValidation } = useFormSubmission(
    methods,
    form,
    validatePage,
    onSubmit,
    setIsValidating
  );

  // Utiliser sectionVisibility et pageVisibility depuis navigation (calculés dans FormEngine.tsx)
  const sectionVisibility = navigation.sectionVisibility;
  const pageVisibility = navigation.pageVisibility;

  // Application du filtrage dynamique aux champs de la section courante
  const filteredPagedFields = useSectionDynamicFiltering(navigation.pagedFields);

  // Redirection automatique si la section actuelle devient cachée
  useEffect(() => {
    if (sectionVisibility && sectionVisibility.length > 0) {
      if (!sectionVisibility[navigation.sectionIndex]) {
        // Chercher la prochaine section visible
        const nextVisible = sectionVisibility.findIndex(
          (visible, idx) => visible && idx > navigation.sectionIndex
        );
        if (nextVisible !== -1) {
          navigation.goToStep(nextVisible, 0);
          return;
        }
        
        // Sinon, chercher la section visible précédente
        const previousVisible = sectionVisibility.lastIndexOf(
          true, 
          navigation.sectionIndex - 1
        );
        if (previousVisible !== -1) {
          navigation.goToStep(previousVisible, 0);
        }
      }
    }
  }, [sectionVisibility, navigation.sectionIndex, navigation.goToStep]);

  // Redirection automatique si la page actuelle devient vide
  useEffect(() => {
    if (pageVisibility && pageVisibility.length > 0) {
      const pageCounts = pageVisibility[navigation.sectionIndex];
      if (!pageCounts || pageCounts.length === 0) {
        return;
      }

      const currentPageCount = pageCounts[navigation.fieldPage] || 0;
      if (currentPageCount > 0) {
        return; // Page actuelle contient des champs visibles
      }

      // Chercher la prochaine page visible dans la section actuelle
      const nextPage = pageCounts.findIndex(
        (count, idx) => count > 0 && idx > navigation.fieldPage
      );
      if (nextPage !== -1) {
        navigation.goToStep(navigation.sectionIndex, nextPage);
        return;
      }

      // Chercher la page visible précédente dans la section actuelle
      for (let idx = navigation.fieldPage - 1; idx >= 0; idx--) {
        if (pageCounts[idx] > 0) {
          navigation.goToStep(navigation.sectionIndex, idx);
          return;
        }
      }

      // Si aucune page visible dans la section actuelle, chercher dans les autres sections
      const nextSectionIndex = pageVisibility.findIndex(
        (counts, idx) => {
          const sectionPageCounts = counts.filter(count => count > 0);
          return sectionPageCounts.length > 0 && idx > navigation.sectionIndex;
        }
      );
      if (nextSectionIndex !== -1) {
        const nextPageIndex = pageVisibility[nextSectionIndex].findIndex(
          (count) => count > 0
        );
        navigation.goToStep(nextSectionIndex, Math.max(0, nextPageIndex));
        return;
      }

      // Chercher la dernière section/page visible précédente
      for (let idx = navigation.sectionIndex - 1; idx >= 0; idx--) {
        const counts = pageVisibility[idx];
        const sectionPageCounts = counts.filter(count => count > 0);
        if (sectionPageCounts.length > 0) {
          const lastPage = (() => {
            for (let pageIdx = counts.length - 1; pageIdx >= 0; pageIdx--) {
              if (counts[pageIdx] > 0) {
                return pageIdx;
              }
            }
            return 0;
          })();
          navigation.goToStep(idx, lastPage);
          return;
        }
      }
    }
  }, [pageVisibility, navigation.sectionIndex, navigation.fieldPage, navigation.goToStep]);

  // Utiliser le hook TFU si disponible et si c'est le formulaire TFU
  // if (useTFUFormMonitor && form.name?.toLowerCase().includes('tfu')) {
  //   useTFUFormMonitor();
  // }

  return (
    <>
      <FormSyncComponent formId={formId} sections={form.sections} />

      <div 
        className="h-full w-[100%] laptop:w-[90%] flex flex-col items-center justify-center pb-20 md:pb-0"
        style={{
          backgroundColor: containerStyles?.mainContainer?.backgroundColor || '#ffffff',
          borderColor: containerStyles?.mainContainer?.borderColor,
          borderWidth: containerStyles?.mainContainer?.borderWidth 
            ? (typeof containerStyles.mainContainer.borderWidth === 'number' 
                ? `${containerStyles.mainContainer.borderWidth}px` 
                : containerStyles.mainContainer.borderWidth)
            : undefined,
          borderStyle: containerStyles?.mainContainer?.borderWidth ? 'solid' : undefined,
        }}
      >
        <FormProgressBar 
          currentStep={navigation.currentVisibleStep ?? navigation.currentStep} 
          totalSteps={navigation.totalVisibleSteps ?? navigation.totalSteps}
          progressBarType={progressBarType}
          sections={sections}
          sectionVisibility={navigation.sectionVisibility}
          currentSectionIndex={navigation.sectionIndex}
        />
        <FormHeader 
          form={form} 
          currentLang={currentLang}
          headerOptions={headerOptions}
        />

        <div className="flex-1 w-full flex flex-col items-center justify-center">
          <FormSection
            section={navigation.currentSection}
            fields={filteredPagedFields} // Utiliser les champs filtrés
            currentLang={currentLang}
            fadeKey={navigation.fadeKey}
            onFieldChange={handleFieldChange}
            formValues={formValues}
            formId={formId}
            paginationMode={paginationMode}
            onClearForm={onClearAll}
            allSections={form.sections}
            currentSectionIndex={navigation.sectionIndex}
            onSubmit={handleSubmitWithValidation}
            onNext={handleNext}
            isLastSection={navigation.isLastSection}
            sectionContainerStyles={containerStyles?.sectionContainer}
            debugInfo={{
              sectionIndex: navigation.sectionIndex,
              fieldPage: navigation.fieldPage,
              ...navigation.debugInfo
            }}
          />
        </div>

        <FormNavigation
          onPrevious={navigation.goToPrevious}
          onNext={handleNext}
          onPreviousVisible={navigation.goToPreviousVisible}
          onNextVisible={navigation.goToNextVisible}
          onClearAll={onClearAll}
          onSubmit={handleSubmitWithValidation}
          isFirstSection={navigation.isFirstSection}
          isLastSection={navigation.isLastSection}
          isValidating={isValidating}
          onSubmitButtonText={submitButtonText}
          showStepNavigation={navigation.totalSteps > 1}
          displayDeleteButton={displayDeleteButton}
        />
      </div>
    </>
  );
};

export default FormEngineContent;