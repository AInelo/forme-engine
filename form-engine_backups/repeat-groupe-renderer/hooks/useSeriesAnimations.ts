import { useRef, useCallback } from 'react';
import { gsap } from 'gsap';

export const useSeriesAnimations = (expandedSeries: Set<number>, basedOnValue: number) => {
  const seriesRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const animateSeriesToggle = useCallback((index: number, isExpanding: boolean) => {
    const seriesElement = seriesRefs.current[index];
    if (!seriesElement) return;

    // Optimisation : Animation plus légère sur mobile
    const isMobile = window.innerWidth < 768;
    const duration = isMobile ? 0.2 : 0.3;

    if (isExpanding) {
      gsap.set(seriesElement, { height: "auto", opacity: 1 });
      const autoHeight = seriesElement.scrollHeight;
      gsap.fromTo(seriesElement, 
        { height: 0, opacity: 0 },
        { 
          height: autoHeight, 
          opacity: 1,
          duration,
          ease: "power2.out"
        }
      );
    } else {
      gsap.to(seriesElement, {
        height: 0,
        opacity: 0,
        duration,
        ease: "power2.inOut"
      });
    }
  }, []);

  const animateExpandAll = useCallback(() => {
    const allIndices = Array.from({ length: basedOnValue }, (_, i) => i);
    const isMobile = window.innerWidth < 768;
    const duration = isMobile ? 0.15 : 0.3;
    const stagger = isMobile ? 0.05 : 0.1;

    // Optimisation : Animation en lot pour éviter le blocage
    allIndices.forEach((index, i) => {
      const seriesElement = seriesRefs.current[index];
      if (seriesElement && !expandedSeries.has(index)) {
        gsap.set(seriesElement, { height: "auto", opacity: 1 });
        const autoHeight = seriesElement.scrollHeight;
        
        gsap.fromTo(seriesElement, 
          { height: 0, opacity: 0 },
          { 
            height: autoHeight, 
            opacity: 1,
            duration,
            delay: i * stagger,
            ease: "power2.out"
          }
        );
      }
    });
  }, [basedOnValue, expandedSeries]);

  const animateCollapseAll = useCallback(() => {
    const isMobile = window.innerWidth < 768;
    const duration = isMobile ? 0.15 : 0.3;
    const stagger = isMobile ? 0.05 : 0.1;

    // Optimisation : Animation en lot pour éviter le blocage
    expandedSeries.forEach((index, i) => {
      const seriesElement = seriesRefs.current[index];
      if (seriesElement) {
        gsap.to(seriesElement, {
          height: 0,
          opacity: 0,
          duration,
          delay: i * stagger,
          ease: "power2.inOut"
        });
      }
    });
  }, [expandedSeries]);

  return {
    seriesRefs,
    animateSeriesToggle,
    animateExpandAll,
    animateCollapseAll
  };
};