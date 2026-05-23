import { useRef, useCallback } from 'react';

export const useSeriesAnimations = (expandedSeries: Set<number>, basedOnValue: number) => {
  const seriesRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const animateSeriesToggle = useCallback((index: number, isExpanding: boolean) => {
    const el = seriesRefs.current[index];
    if (!el) return;

    const duration = window.innerWidth < 768 ? 200 : 300;

    if (isExpanding) {
      const targetHeight = el.scrollHeight;
      const anim = el.animate(
        [
          { height: '0px', opacity: '0' },
          { height: `${targetHeight}px`, opacity: '1' },
        ],
        { duration, easing: 'ease-out', fill: 'forwards' }
      );
      anim.onfinish = () => { el.style.height = 'auto'; };
    } else {
      const currentHeight = el.scrollHeight;
      el.animate(
        [
          { height: `${currentHeight}px`, opacity: '1' },
          { height: '0px', opacity: '0' },
        ],
        { duration, easing: 'ease-in-out', fill: 'forwards' }
      );
    }
  }, []);

  const animateExpandAll = useCallback(() => {
    const isMobile = window.innerWidth < 768;
    const duration = isMobile ? 150 : 300;
    const stagger = isMobile ? 50 : 100;

    Array.from({ length: basedOnValue }, (_, i) => i).forEach((index, i) => {
      const el = seriesRefs.current[index];
      if (el && !expandedSeries.has(index)) {
        const targetHeight = el.scrollHeight;
        const anim = el.animate(
          [
            { height: '0px', opacity: '0' },
            { height: `${targetHeight}px`, opacity: '1' },
          ],
          { duration, delay: i * stagger, easing: 'ease-out', fill: 'forwards' }
        );
        anim.onfinish = () => { el.style.height = 'auto'; };
      }
    });
  }, [basedOnValue, expandedSeries]);

  const animateCollapseAll = useCallback(() => {
    const isMobile = window.innerWidth < 768;
    const duration = isMobile ? 150 : 300;
    const stagger = isMobile ? 50 : 100;

    expandedSeries.forEach((index, i) => {
      const el = seriesRefs.current[index];
      if (el) {
        const currentHeight = el.scrollHeight;
        el.animate(
          [
            { height: `${currentHeight}px`, opacity: '1' },
            { height: '0px', opacity: '0' },
          ],
          { duration, delay: i * stagger, easing: 'ease-in-out', fill: 'forwards' }
        );
      }
    });
  }, [expandedSeries]);

  return {
    seriesRefs,
    animateSeriesToggle,
    animateExpandAll,
    animateCollapseAll,
  };
};
