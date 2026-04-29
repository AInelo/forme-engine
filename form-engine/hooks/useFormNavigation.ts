// 📁 src/hooks/useFormNavigation.ts
import { useState, useMemo, useRef } from 'react';
import type { FormStructure, FormField, Section } from '../types/formTypeStructure';
import { hasOTPField } from '../types/formUtils';

interface UseFormNavigationProps {
  form: FormStructure;
  fieldsPerPage?: number;
  paginationMode?: "byFields" | "bySection";
  sectionVisibility?: boolean[]; // Visibilité de chaque section (optionnel)
  pageVisibility?: number[][]; // Nombre de champs visibles par page pour chaque section (optionnel)
}

export const useFormNavigation = ({ 
  form, 
  fieldsPerPage = 4,
  paginationMode = "byFields",
  sectionVisibility,
  pageVisibility
}: UseFormNavigationProps) => {
  const [sectionIndex, setSectionIndex] = useState(0);
  const [fieldPage, setFieldPage] = useState(0);
  
  // 🔥 Nouveau : Référence pour générer des clés uniques lors du changement de section
  const sectionChangeCounter = useRef(0);
  
  // Capturer paginationMode dans une constante pour éviter les erreurs TypeScript dans les fonctions
  const currentPaginationMode = paginationMode;

  const currentSection: Section | undefined = form.sections[sectionIndex];
  const fields: FormField[] = currentSection?.formFields || [];

  // Détecter si la section courante contient un champ OTP
  const isOTPSection = useMemo(() => {
    return currentSection ? hasOTPField(currentSection) : false;
  }, [currentSection]);

  // ⚠️ IMPORTANT: Tous les hooks doivent être appelés AVANT les conditions pour éviter l'erreur "Rendered fewer hooks than expected"
  // Calculer totalVisibleSteps et currentVisibleStep pour le mode "bySection" basés sur sectionVisibility si disponible
  const totalVisibleStepsForSection = useMemo(() => {
    if (sectionVisibility && sectionVisibility.length > 0) {
      // Compter uniquement les sections visibles
      return sectionVisibility.filter(visible => visible).length || 1;
    }
    // Fallback : compter toutes les sections
    return form.sections.length;
  }, [sectionVisibility, form.sections.length]);

  const currentVisibleStepForSection = useMemo(() => {
    if (sectionVisibility && sectionVisibility.length > 0) {
      // Compter uniquement les sections visibles jusqu'à la section actuelle
      let step = 0;
      for (let i = 0; i <= sectionIndex && i < sectionVisibility.length; i++) {
        if (sectionVisibility[i]) {
          step += 1;
        }
      }
      return Math.max(1, step);
    }
    // Fallback : compter normalement
    return sectionIndex + 1;
  }, [sectionVisibility, sectionIndex]);

  // Mode "byFields" : comportement actuel (pagination par nombre de champs)
  // Exception : si la section contient un OTP, afficher tous les champs (comme bySection)
  const totalFieldPages = isOTPSection 
    ? 1 
    : Math.ceil(fields.length / fieldsPerPage);

  const pagedFields = isOTPSection
    ? fields // Afficher tous les champs si section OTP
    : fields.slice(
    fieldPage * fieldsPerPage,
    (fieldPage + 1) * fieldsPerPage
  );
  
  // Si section OTP, forcer fieldPage à 0
  const effectiveFieldPage = isOTPSection ? 0 : fieldPage;

  // Calculer totalVisibleSteps et currentVisibleStep basés sur pageVisibility si disponible
  const totalVisibleSteps = useMemo(() => {
    if (pageVisibility && pageVisibility.length > 0) {
      // Compter uniquement les pages avec des champs visibles (count > 0)
      return pageVisibility.reduce((sum, pages) => {
        return sum + pages.filter(count => count > 0).length;
      }, 0) || 1;
    }
    // Fallback : calculer le total normal si pageVisibility n'est pas fourni
    return form.sections.reduce((acc, section) => {
      return acc + Math.ceil((section.formFields?.length || 0) / fieldsPerPage);
    }, 0);
  }, [pageVisibility, form.sections, fieldsPerPage]);

  const currentVisibleStep = useMemo(() => {
    if (pageVisibility && pageVisibility.length > 0) {
      let step = 0;
      for (let i = 0; i < pageVisibility.length; i++) {
        const pages = pageVisibility[i] || [];
        // Filtrer uniquement les pages avec des champs visibles (count > 0)
        const visiblePages = pages.filter((count) => count > 0);
        
        if (i < sectionIndex) {
          // Compter toutes les pages visibles des sections précédentes
          step += visiblePages.length;
        } else if (i === sectionIndex) {
          // Compter les pages visibles jusqu'à la page actuelle
          for (let pageIdx = 0; pageIdx <= effectiveFieldPage && pageIdx < pages.length; pageIdx++) {
            if (pages[pageIdx] > 0) {
              step += 1;
            }
          }
          return Math.max(1, step);
        }
      }
      return 1;
    }
    // Fallback : calculer le step normal si pageVisibility n'est pas fourni
    let currentStep = 0;
    for (let s = 0; s < sectionIndex; s++) {
      const section = form.sections[s];
      const sectionHasOTP = section ? hasOTPField(section) : false;
      if (sectionHasOTP) {
        currentStep += 1; // Section OTP = 1 étape
      } else {
        currentStep += Math.ceil((section?.formFields?.length || 0) / fieldsPerPage);
      }
    }
    currentStep += effectiveFieldPage + 1;
    return currentStep;
  }, [pageVisibility, sectionIndex, effectiveFieldPage, form.sections, fieldsPerPage]);

  const navigationState = useMemo(() => {
    const isFirstSection = sectionIndex === 0 && effectiveFieldPage === 0;
    const isLastSection =
      sectionIndex === form.sections.length - 1 &&
      effectiveFieldPage === totalFieldPages - 1;

    // Utiliser totalVisibleSteps et currentVisibleStep si disponibles, sinon calculer normalement
    const totalSteps = totalVisibleSteps;
    const currentStep = currentVisibleStep;

    return {
      isFirstSection,
      isLastSection,
      totalSteps,
      currentStep,
      // 🔥 Amélioration : fadeKey plus unique avec compteur de changement de section
      fadeKey: (sectionIndex * 10000) + (sectionChangeCounter.current * 1000) + effectiveFieldPage,
      isOTPSection, // 🆕 Flag pour indiquer si c'est une section OTP
    };
  }, [sectionIndex, effectiveFieldPage, form.sections, totalFieldPages, fieldsPerPage, isOTPSection, totalVisibleSteps, currentVisibleStep]);

  // Mode "bySection" : tous les champs de la section, pas de pagination par champs
  if (currentPaginationMode === "bySection") {
    const pagedFieldsBySection = fields; // Tous les champs de la section

    const totalSteps = totalVisibleStepsForSection;
    const currentStep = currentVisibleStepForSection;
    const isFirstSection = sectionIndex === 0;
    const isLastSection = sectionIndex === form.sections.length - 1;

    const goToPrevious = () => {
      if (sectionIndex > 0) {
        sectionChangeCounter.current += 1;
        setSectionIndex(sectionIndex - 1);
      }
    };

    const goToNext = () => {
      if (sectionIndex < form.sections.length - 1) {
        sectionChangeCounter.current += 1;
        setSectionIndex(sectionIndex + 1);
      }
    };

    const goToFirst = () => {
      sectionChangeCounter.current += 1;
      setSectionIndex(0);
    };

    const goToLast = () => {
      sectionChangeCounter.current += 1;
      const lastSectionIndex = form.sections.length - 1;
      setSectionIndex(lastSectionIndex);
    };

    const goToStep = (targetSectionIndex: number, _targetFieldPage: number = 0) => {
      if (targetSectionIndex >= 0 && targetSectionIndex < form.sections.length) {
        if (targetSectionIndex !== sectionIndex) {
          sectionChangeCounter.current += 1;
        }
        setSectionIndex(targetSectionIndex);
      }
    };

    // Navigation intelligente pour mode bySection
    const goToPreviousVisible = () => {
      if (sectionVisibility && sectionVisibility.length > 0) {
        for (let sectionIdx = sectionIndex - 1; sectionIdx >= 0; sectionIdx--) {
          if (sectionVisibility[sectionIdx]) {
            goToStep(sectionIdx, 0);
            return;
          }
        }
      } else {
        goToPrevious();
      }
    };

    const goToNextVisible = () => {
      if (sectionVisibility && sectionVisibility.length > 0) {
        for (let sectionIdx = sectionIndex + 1; sectionIdx < sectionVisibility.length; sectionIdx++) {
          if (sectionVisibility[sectionIdx]) {
            goToStep(sectionIdx, 0);
            return;
          }
        }
      } else {
        goToNext();
      }
    };

    return {
      sectionIndex,
      fieldPage: 0, // Toujours 0 en mode bySection
      currentSection,
      pagedFields: pagedFieldsBySection,
      isFirstSection,
      isLastSection,
      totalSteps,
      currentStep,
      totalVisibleSteps: totalVisibleStepsForSection,
      currentVisibleStep: currentVisibleStepForSection,
      fadeKey: (sectionIndex * 10000) + (sectionChangeCounter.current * 1000),
      goToPrevious,
      goToNext,
      goToPreviousVisible,
      goToNextVisible,
      goToFirst,
      goToLast,
      goToStep,
      sectionVisibility,
      pageVisibility,
      debugInfo: {
        sectionCount: form.sections.length,
        totalFieldPages: 1, // Toujours 1 page par section
        fieldsOnCurrentPage: pagedFieldsBySection.length,
      },
    };
  }

  // Définir toutes les fonctions de navigation AVANT les conditions
  const goToPrevious = () => {
    // Si section OTP, passer directement à la section précédente
    if (isOTPSection) {
      if (sectionIndex > 0) {
        sectionChangeCounter.current += 1;
        setSectionIndex(sectionIndex - 1);
        const prevSection = form.sections[sectionIndex - 1];
        if (prevSection) {
          const prevHasOTP = hasOTPField(prevSection);
          setFieldPage(prevHasOTP ? 0 : Math.ceil((prevSection.formFields?.length || 0) / fieldsPerPage) - 1);
        }
      }
    } else if (fieldPage > 0) {
      setFieldPage(fieldPage - 1);
    } else if (sectionIndex > 0) {
      const prevSection = form.sections[sectionIndex - 1];
      if (prevSection) {
        setSectionIndex(sectionIndex - 1);
        const prevFields = prevSection.formFields || [];
        const prevHasOTP = hasOTPField(prevSection);
        setFieldPage(prevHasOTP ? 0 : Math.ceil(prevFields.length / fieldsPerPage) - 1);
      }
    }
  };

  const goToNext = () => {
    // Si section OTP, passer directement à la section suivante
    if (isOTPSection) {
      if (sectionIndex < form.sections.length - 1) {
        sectionChangeCounter.current += 1;
        setSectionIndex(sectionIndex + 1);
        setFieldPage(0);
      }
    } else if (fieldPage < totalFieldPages - 1) {
      setFieldPage(fieldPage + 1);
    } else if (sectionIndex < form.sections.length - 1) {
      // 🔥 Incrémenter le compteur lors du changement de section
      sectionChangeCounter.current += 1;
      setSectionIndex(sectionIndex + 1);
      setFieldPage(0);
    }
  };

  // 🔥 Nouvelle fonction pour retourner à la première section/page
  const goToFirst = () => {
    // 🔥 Incrémenter le compteur lors du changement de section
    sectionChangeCounter.current += 1;
    setSectionIndex(0);
    setFieldPage(0);
  };

  // 🔥 Fonction bonus pour aller à la dernière section/page
  const goToLast = () => {
    // 🔥 Incrémenter le compteur lors du changement de section
    sectionChangeCounter.current += 1;
    const lastSectionIndex = form.sections.length - 1;
    setSectionIndex(lastSectionIndex);
    
    const lastSection = form.sections[lastSectionIndex];
    if (lastSection) {
      const lastSectionFields = lastSection.formFields || [];
      const lastFieldPage = Math.ceil(lastSectionFields.length / fieldsPerPage) - 1;
      setFieldPage(Math.max(0, lastFieldPage));
    }
  };

  // 🔥 Fonction pour aller à une section/page spécifique
  const goToStep = (targetSectionIndex: number, targetFieldPage: number = 0) => {
    if (targetSectionIndex >= 0 && targetSectionIndex < form.sections.length) {
      // 🔥 Incrémenter le compteur seulement si on change de section
      if (targetSectionIndex !== sectionIndex) {
        sectionChangeCounter.current += 1;
      }
      
      setSectionIndex(targetSectionIndex);
      
      const targetSection = form.sections[targetSectionIndex];
      if (targetSection) {
        const targetHasOTP = hasOTPField(targetSection);
        if (targetHasOTP) {
          setFieldPage(0); // Section OTP = toujours page 0
        } else {
        const targetFields = targetSection.formFields || [];
        const maxFieldPage = Math.ceil(targetFields.length / fieldsPerPage) - 1;
        setFieldPage(Math.max(0, Math.min(targetFieldPage, maxFieldPage)));
        }
      }
    }
  };

  // Navigation intelligente : sauter les sections/pages cachées
  const goToPreviousVisible = () => {
    const mode = paginationMode; // Utiliser la prop directement pour éviter le narrowing TypeScript
    if (mode === "bySection") {
      // Mode bySection : chercher la section visible précédente
      if (sectionVisibility && sectionVisibility.length > 0) {
        for (let sectionIdx = sectionIndex - 1; sectionIdx >= 0; sectionIdx--) {
          if (sectionVisibility[sectionIdx]) {
            goToStep(sectionIdx, 0);
            return;
          }
        }
      } else {
        // Fallback : comportement normal
        goToPrevious();
      }
    } else {
      // Mode byFields : chercher la page visible précédente
      if (pageVisibility && pageVisibility.length > 0) {
        const currentPages = pageVisibility[sectionIndex] || [];
        
        // Chercher dans les pages de la section actuelle
        for (let pageIdx = effectiveFieldPage - 1; pageIdx >= 0; pageIdx--) {
          if (currentPages[pageIdx] > 0) {
            goToStep(sectionIndex, pageIdx);
            return;
          }
        }
        
        // Chercher dans les sections précédentes
        for (let sectionIdx = sectionIndex - 1; sectionIdx >= 0; sectionIdx--) {
          const pages = pageVisibility[sectionIdx] || [];
          for (let pageIdx = pages.length - 1; pageIdx >= 0; pageIdx--) {
            if (pages[pageIdx] > 0) {
              goToStep(sectionIdx, pageIdx);
              return;
            }
          }
        }
      } else {
        // Fallback : comportement normal
        goToPrevious();
      }
    }
  };

  const goToNextVisible = () => {
    const mode = paginationMode; // Utiliser la prop directement pour éviter le narrowing TypeScript
    if (mode === "bySection") {
      // Mode bySection : chercher la section visible suivante
      if (sectionVisibility && sectionVisibility.length > 0) {
        for (let sectionIdx = sectionIndex + 1; sectionIdx < sectionVisibility.length; sectionIdx++) {
          if (sectionVisibility[sectionIdx]) {
            goToStep(sectionIdx, 0);
            return;
          }
        }
      } else {
        // Fallback : comportement normal
        goToNext();
      }
    } else {
      // Mode byFields : chercher la page visible suivante
      if (pageVisibility && pageVisibility.length > 0) {
        const currentPages = pageVisibility[sectionIndex] || [];
        
        // Chercher dans les pages de la section actuelle
        for (let pageIdx = effectiveFieldPage + 1; pageIdx < currentPages.length; pageIdx++) {
          if (currentPages[pageIdx] > 0) {
            goToStep(sectionIndex, pageIdx);
            return;
          }
        }
        
        // Chercher dans les sections suivantes
        for (let sectionIdx = sectionIndex + 1; sectionIdx < pageVisibility.length; sectionIdx++) {
          const pages = pageVisibility[sectionIdx] || [];
          for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
            if (pages[pageIdx] > 0) {
              goToStep(sectionIdx, pageIdx);
              return;
            }
          }
        }
      } else {
        // Fallback : comportement normal
        goToNext();
      }
    }
  };

  return {
    sectionIndex,
    fieldPage: effectiveFieldPage, // Utiliser effectiveFieldPage pour les sections OTP
    currentSection,
    pagedFields,

    // Calculs
    ...navigationState,
    totalVisibleSteps,
    currentVisibleStep,

    // Actions de navigation
    goToPrevious,
    goToNext,
    goToPreviousVisible,
    goToNextVisible,
    goToFirst,      // 🔥 Nouvelle fonction
    goToLast,       // 🔥 Fonction bonus
    goToStep,       // 🔥 Fonction bonus pour navigation directe

    // Visibilité (exposée pour utilisation dans FormEngineContent)
    sectionVisibility,
    pageVisibility,

    // Debug info
    debugInfo: {
      sectionCount: form.sections.length,
      totalFieldPages,
      fieldsOnCurrentPage: pagedFields.length,
    },
  };
};
