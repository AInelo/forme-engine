import React, { useEffect } from 'react';
import FieldRenderer from '../FieldRenderer';
import RepeatGroupModal from './components/RepeatGroupModal';
import { useRepeatGroupLogic } from './hooks/useRepeatGroupLogic';
import { useModalLogic } from './hooks/useModalLogic';
import type { FormField } from '../types/formTypeStructure';

interface RepeatGroupRendererProps {
  field: FormField;
  formValues: Record<string, any>;
  currentLang?: string;
}

const RepeatGroupRenderer: React.FC<RepeatGroupRendererProps> = ({
  field,
  formValues,
  currentLang = "fr",
}) => {
  const {
    expandedSeries,
    setExpandedSeries,
    basedOnValue,
    filledSeries,
    watchedValue,
    hasFilledData,
    repeatGroup,
    toggleSeries,
    prefillTempFields,
    saveGroups,
    clearGroups,
    buildTempFieldName,
    buildNestedGroupFieldName,
    buildNestedChildFieldName
  } = useRepeatGroupLogic(field, formValues);

  const {
    isModalOpen,
    isViewMode,
    modalRef,
    overlayRef,
    contentRef,
    openModal,
    closeModal,
    manuallyClosed
  } = useModalLogic();

  // Effet pour déclencher automatiquement l'ouverture
  useEffect(() => {
    const currentValue = Number(watchedValue) || 0;
    
    if (currentValue > 0 && !hasFilledData && !isModalOpen) {
      setTimeout(() => {
        openModal(false, false); // Deuxième param: false = ouverture auto, donc pas d'ouverture si manuallyClosed
      }, 300);
    } else if (currentValue === 0) {
      closeModal(false); // Fermeture automatique, pas manuelle
    }
  }, [watchedValue, hasFilledData, isModalOpen, openModal, closeModal]);

  const handleOpenEdit = () => {
    prefillTempFields(filledSeries);
    openModal(false, true); // Ouverture manuelle
  };

  const handleOpenView = () => {
    prefillTempFields(filledSeries);
    openModal(true, true); // Ouverture manuelle
  };

  const handleSave = () => {
    saveGroups();
    closeModal(true); // Fermeture après sauvegarde = manuelle pour empêcher réouverture
  };
  
  const handleClose = () => {
    closeModal(true); // X = fermeture manuelle pour empêcher la réouverture auto
  };
  
  const handleClear = () => {
    clearGroups();
    closeModal(false); // Effacer = nettoyage + fermeture (pas manuelle car data supprimée)
  };

  return (
    <div className="space-y-6">
      <FieldRenderer
        field={field}
        currentLang={currentLang}
        formValues={formValues}
        showControlButtons={true}
        hasFilledData={hasFilledData}
        basedOnValue={basedOnValue}
        onOpenModal={() => openModal(false, true)}
        onOpenEdit={handleOpenEdit}
        onOpenView={handleOpenView}
      />

      <RepeatGroupModal
        isModalOpen={isModalOpen}
        isViewMode={isViewMode}
        modalRef={modalRef}
        overlayRef={overlayRef}
        contentRef={contentRef}
        expandedSeries={expandedSeries}
        basedOnValue={basedOnValue}
        hasFilledData={hasFilledData}
        repeatGroup={repeatGroup}
        currentLang={currentLang}
        formValues={formValues}
        filledSeries={filledSeries}
        buildTempFieldName={buildTempFieldName}
        buildNestedGroupFieldName={buildNestedGroupFieldName}
        buildNestedChildFieldName={buildNestedChildFieldName}
        onClose={handleClose}
        onClear={handleClear}
        onSave={handleSave}
        onToggleSeries={toggleSeries}
        setExpandedSeries={setExpandedSeries}
      />
    </div>
  );
};

export default RepeatGroupRenderer;