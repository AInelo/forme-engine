import React, { useEffect, useMemo } from 'react';
import ModalHeader from './ModalHeader';
import SeriesItem from './SeriesItem';
import ModalFooter from './ModalFooter';
import { useSeriesAnimations } from '../hooks/useSeriesAnimations';

interface RepeatGroupModalProps {
  isModalOpen: boolean;
  isViewMode: boolean;
   modalRef: React.RefObject<HTMLDivElement | null>;
  overlayRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  expandedSeries: Set<number>;
  basedOnValue: number;
  hasFilledData: boolean;
  repeatGroup: any;
  currentLang: string;
  formValues: Record<string, any>;
  filledSeries: any[];
  buildTempFieldName: (childFieldName: string, index: number) => string;
  buildNestedGroupFieldName: (childGroupFieldName: string, index: number) => string;
  buildNestedChildFieldName: (
    childGroupFieldName: string,
    index: number,
    childFieldName: string,
    nestedIndex: number
  ) => string;
  onClose: () => void;
  onClear?: () => void;
  onSave: () => void;
  onToggleSeries: (index: number) => void;
  setExpandedSeries: (expanded: Set<number>) => void;
}

const RepeatGroupModal: React.FC<RepeatGroupModalProps> = ({
  isModalOpen,
  isViewMode,
  modalRef,
  overlayRef,
  contentRef,
  expandedSeries,
  basedOnValue,
  hasFilledData,
  repeatGroup,
  currentLang,
  formValues,
  filledSeries,
  buildTempFieldName,
  buildNestedGroupFieldName,
  buildNestedChildFieldName,
  onClose,
  onClear,
  onSave,
  onToggleSeries,
  setExpandedSeries
}) => {
  const { seriesRefs, animateSeriesToggle, animateExpandAll, animateCollapseAll } = 
    useSeriesAnimations(expandedSeries, basedOnValue);

  // Optimisation : Mémoriser les indices à rendre
  const seriesToRender = useMemo(() => {
    if (!isModalOpen) return [];
    
    // Toujours rendre toutes les séries (optimisation supprimée pour éviter les bugs)
    // On laisse le scroll gérer la performance
    const visibleIndices = new Set<number>();
    
    for (let i = 0; i < basedOnValue; i++) {
      visibleIndices.add(i);
    }
    
    return Array.from(visibleIndices).sort((a, b) => a - b);
  }, [isModalOpen, basedOnValue]);

  useEffect(() => {
    if (isModalOpen) {
      // Optimisation : Étendre seulement la première série au lieu de toutes
      setExpandedSeries(new Set([0]));
    }
  }, [isModalOpen, setExpandedSeries]);

  const handleToggleSeries = (index: number) => {
    const isExpanding = !expandedSeries.has(index);
    
    // Optimisation : Animation plus légère
    if (isExpanding) {
      onToggleSeries(index);
      // Animation différée pour éviter le blocage
      setTimeout(() => {
        animateSeriesToggle(index, true);
      }, 50);
    } else {
      animateSeriesToggle(index, false);
      setTimeout(() => onToggleSeries(index), 300);
    }
  };

  const handleExpandAll = () => {
    // Optimisation : Étendre progressivement
    const allIndices = Array.from({ length: basedOnValue }, (_, i) => i);
    setExpandedSeries(new Set(allIndices));
    
    // Animation différée pour éviter le blocage
    setTimeout(() => {
      animateExpandAll();
    }, 100);
  };

  const handleCollapseAll = () => {
    animateCollapseAll();
    setTimeout(() => {
      setExpandedSeries(new Set());
    }, 300);
  };

  if (!isModalOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4"
    >
      {/* FULLSCREEN OVERLAY */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* MODAL CONTENT */}
      <div
        ref={contentRef}
        className="relative z-10 bg-white w-[90%] sm:w-auto max-w-4xl max-h-[95vh] sm:max-h-[90vh] rounded-xl shadow-xl overflow-hidden flex flex-col"
      >
        <ModalHeader
          isViewMode={isViewMode}
          hasFilledData={hasFilledData}
          fieldName={repeatGroup.fieldName}
          basedOnValue={basedOnValue}
          onClose={onClose}
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
        />

        {/* MAIN CONTENT - Optimisé */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="space-y-4">
            {seriesToRender.map((index) => (
              <SeriesItem
                key={index}
                index={index}
                repeatGroup={repeatGroup}
                existingGroupData={filledSeries[index] ?? {}}
                buildTempFieldName={buildTempFieldName}
                buildNestedGroupFieldName={buildNestedGroupFieldName}
                buildNestedChildFieldName={buildNestedChildFieldName}
                isExpanded={expandedSeries.has(index)}
                isViewMode={isViewMode}
                currentLang={currentLang}
                formValues={formValues}
                onToggle={handleToggleSeries}
                seriesRef={(el) => { seriesRefs.current[index] = el; }}
              />
            ))}
          </div>
        </div>

        <ModalFooter
          isViewMode={isViewMode}
          onClose={onClose}
          onClear={onClear}
          onSave={onSave}
        />
      </div>
    </div>
  );
};

export default RepeatGroupModal;