import React from 'react';
import PContent from '../internal/text/PContent';
import type { ProgressBarType, Section } from '../types/formTypeStructure';

interface FormProgressBarProps {
  currentStep: number;
  totalSteps: number;
  progressBarType?: ProgressBarType;
  sections?: Section[];
  sectionVisibility?: boolean[];
  currentSectionIndex?: number;
}

// Sous-composant pour default_step (comportement actuel)
const DefaultStepProgressBar: React.FC<{ currentStep: number; totalSteps: number }> = ({ currentStep, totalSteps }) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mt-4 w-full max-w-4xl mb-4">
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-secondary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <PContent className="text-right font-semibold text-xs text-gray-500 mt-1">
        Étape {currentStep} / {totalSteps}
      </PContent>
    </div>
  );
};

// Sous-composant pour linear (barre simple sans texte)
const LinearProgressBar: React.FC<{ currentStep: number; totalSteps: number }> = ({ currentStep, totalSteps }) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mt-4 w-full max-w-4xl mb-4">
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-secondary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

// Sous-composant pour pastel (barre segmentée avec bordures arrondies)
const PastelProgressBar: React.FC<{ currentStep: number; totalSteps: number }> = ({ currentStep, totalSteps }) => {
  return (
    <div className="mt-4 w-full max-w-4xl mb-4">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div
              key={stepNumber}
              className={`
                flex-1 h-3 rounded-full transition-all duration-500
                ${isCompleted 
                  ? 'bg-pink-300' 
                  : isActive 
                  ? 'bg-pink-400 ring-2 ring-pink-200 ring-offset-1' 
                  : 'bg-pink-100'
                }
              `}
              style={{
                minWidth: '20px',
              }}
            />
          );
        })}
      </div>
      <PContent className="text-right font-semibold text-xs text-pink-600 mt-1">
        Étape {currentStep} / {totalSteps}
      </PContent>
    </div>
  );
};

// Sous-composant pour custom
const CustomProgressBar: React.FC<{ 
  currentStep: number; 
  totalSteps: number; 
  colors?: { background: string; foreground: string } 
}> = ({ currentStep, totalSteps, colors }) => {
  const progress = (currentStep / totalSteps) * 100;
  
  // Si colors n'est pas défini, utiliser les couleurs par défaut
  const backgroundColor = colors?.background || '#e5e7eb'; // gray-200
  const foregroundColor = colors?.foreground || '#008080'; // secondary

  return (
    <div className="mt-4 w-full max-w-4xl mb-4">
      <div 
        className="h-2 rounded-full overflow-hidden"
        style={{ backgroundColor }}
      >
        <div
          className="h-full transition-all duration-500"
          style={{ 
            width: `${progress}%`,
            backgroundColor: foregroundColor
          }}
        />
      </div>
      <PContent className="text-right font-semibold text-xs text-gray-500 mt-1">
        Étape {currentStep} / {totalSteps}
      </PContent>
    </div>
  );
};

// Sous-composant pour section_bubble
const SectionBubbleProgressBar: React.FC<{ 
  sections: Section[];
  sectionVisibility?: boolean[];
  currentSectionIndex: number;
}> = ({ sections, sectionVisibility, currentSectionIndex }) => {
  // Filtrer les sections visibles en gardant leur index original
  const visibleSectionsWithIndex = sections
    .map((section, index) => ({ section, originalIndex: index }))
    .filter(({ originalIndex }) => 
      !sectionVisibility || sectionVisibility[originalIndex]
    );
  
  const visibleSections = visibleSectionsWithIndex.map(item => item.section);
  
  // Trouver l'index de la section actuelle parmi les sections visibles
  const visibleSectionIndex = visibleSectionsWithIndex.findIndex(
    ({ originalIndex }) => originalIndex === currentSectionIndex
  );
  
  // Si la section actuelle n'est pas visible, utiliser le premier index visible
  const currentVisibleIndex = visibleSectionIndex >= 0 ? visibleSectionIndex : 0;

  return (
    <div className="mt-4 w-full max-w-4xl mb-4">
      <div className="flex items-center justify-center">
        {visibleSections.map((section, index) => {
          const isCompleted = index < currentVisibleIndex;
          const isActive = index === currentVisibleIndex;
          const isUpcoming = index > currentVisibleIndex;

          return (
            <React.Fragment key={section.sectionId || index}>
              {/* Bulle de section */}
              <div className="flex items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                    transition-all duration-300 z-10 relative
                    ${isCompleted 
                      ? 'bg-secondary text-white' 
                      : isActive 
                      ? 'border-4 border-secondary bg-white text-secondary' 
                      : 'border-2 border-gray-300 bg-white text-gray-400'
                    }
                  `}
                >
                  {index + 1}
                </div>
                {/* Ligne de connexion */}
                {index < visibleSections.length - 1 && (
                  <div 
                    className={`
                      h-1 w-16 transition-all duration-500 -mx-1
                      ${index < currentVisibleIndex 
                        ? 'bg-secondary' 
                        : 'bg-gray-200'
                      }
                    `}
                  />
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <PContent className="text-center font-semibold text-xs text-gray-500 mt-2">
        Section {currentVisibleIndex + 1} / {visibleSections.length}
      </PContent>
    </div>
  );
};

// Sous-composant pour section_bubble_pastel
const SectionBubblePastelProgressBar: React.FC<{ 
  sections: Section[];
  sectionVisibility?: boolean[];
  currentSectionIndex: number;
}> = ({ sections, sectionVisibility, currentSectionIndex }) => {
  // Filtrer les sections visibles en gardant leur index original
  const visibleSectionsWithIndex = sections
    .map((section, index) => ({ section, originalIndex: index }))
    .filter(({ originalIndex }) => 
      !sectionVisibility || sectionVisibility[originalIndex]
    );
  
  const visibleSections = visibleSectionsWithIndex.map(item => item.section);
  
  // Trouver l'index de la section actuelle parmi les sections visibles
  const visibleSectionIndex = visibleSectionsWithIndex.findIndex(
    ({ originalIndex }) => originalIndex === currentSectionIndex
  );
  
  // Si la section actuelle n'est pas visible, utiliser le premier index visible
  const currentVisibleIndex = visibleSectionIndex >= 0 ? visibleSectionIndex : 0;

  return (
    <div className="mt-4 w-full max-w-4xl mb-4">
      <div className="flex items-center justify-center">
        {visibleSections.map((section, index) => {
          const isCompleted = index < currentVisibleIndex;
          const isActive = index === currentVisibleIndex;
          const isUpcoming = index > currentVisibleIndex;

          return (
            <React.Fragment key={section.sectionId || index}>
              {/* Bulle de section */}
              <div className="flex items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                    transition-all duration-300 z-10 relative
                    ${isCompleted 
                      ? 'bg-pink-300 text-white' 
                      : isActive 
                      ? 'border-4 border-pink-400 bg-white text-pink-400' 
                      : 'border-2 border-pink-200 bg-white text-pink-300'
                    }
                  `}
                >
                  {index + 1}
                </div>
                {/* Ligne de connexion */}
                {index < visibleSections.length - 1 && (
                  <div 
                    className={`
                      h-1 w-16 transition-all duration-500 -mx-1
                      ${index < currentVisibleIndex 
                        ? 'bg-pink-300' 
                        : 'bg-pink-100'
                      }
                    `}
                  />
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <PContent className="text-center font-semibold text-xs text-pink-600 mt-2">
        Section {currentVisibleIndex + 1} / {visibleSections.length}
      </PContent>
    </div>
  );
};

const FormProgressBar: React.FC<FormProgressBarProps> = ({ 
  currentStep, 
  totalSteps,
  progressBarType,
  sections,
  sectionVisibility,
  currentSectionIndex
}) => {
  // Gestion de la visibilité : si visible === false, ne pas rendre le composant
  // On vérifie cela en premier, mais on ne retourne pas null directement
  // pour éviter les problèmes avec les hooks React
  const shouldRender = progressBarType?.visible !== false;

  // Si progressBarType n'est pas défini, utiliser default_step
  const type = progressBarType?.type || 'default_step';

  // Pour les types section_bubble, on a besoin de sections et currentSectionIndex
  // Si les données ne sont pas disponibles, fallback sur default_step
  const effectiveType = (type === 'section_bubble' || type === 'section_bubble_pastel') 
    && (!sections || sections.length === 0 || currentSectionIndex === undefined)
    ? 'default_step'
    : type;

  // Si visible === false, retourner un div vide avec display: none
  // pour éviter les problèmes avec les hooks React
  if (!shouldRender) {
    return <div style={{ display: 'none' }} />;
  }

  // Rendu selon le type
  switch (effectiveType) {
    case 'default_step':
      return <DefaultStepProgressBar currentStep={currentStep} totalSteps={totalSteps} />;
    
    case 'linear':
      return <LinearProgressBar currentStep={currentStep} totalSteps={totalSteps} />;
    
    case 'pastel':
      return <PastelProgressBar currentStep={currentStep} totalSteps={totalSteps} />;
    
    case 'custom':
      return (
        <CustomProgressBar 
          currentStep={currentStep} 
          totalSteps={totalSteps} 
          colors={progressBarType?.colors}
        />
      );
    
    case 'section_bubble':
      return (
        <SectionBubbleProgressBar 
          sections={sections!}
          sectionVisibility={sectionVisibility}
          currentSectionIndex={currentSectionIndex!}
        />
      );
    
    case 'section_bubble_pastel':
      return (
        <SectionBubblePastelProgressBar 
          sections={sections!}
          sectionVisibility={sectionVisibility}
          currentSectionIndex={currentSectionIndex!}
        />
      );
    
    default:
      return <DefaultStepProgressBar currentStep={currentStep} totalSteps={totalSteps} />;
  }
};

export default FormProgressBar;
