import { useState, useEffect, useRef } from 'react';

export const useModalLogic = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [manuallyClosed, setManuallyClosed] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const openModal = (viewMode: boolean = false, allowAutoOpen: boolean = true) => {
    if (!allowAutoOpen && manuallyClosed) return;
    setIsViewMode(viewMode);
    setIsModalOpen(true);
    if (allowAutoOpen) setManuallyClosed(false);
  };

  const closeModal = (isManualClose: boolean = false) => {
    if (!contentRef.current || !overlayRef.current) return;
    if (isManualClose) setManuallyClosed(true);

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
    };
  };

  // Animation d'ouverture
  useEffect(() => {
    if (isModalOpen && overlayRef.current && contentRef.current) {
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
  }, [isModalOpen]);

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isModalOpen]);

  return {
    isModalOpen,
    isViewMode,
    modalRef,
    overlayRef,
    contentRef,
    openModal,
    closeModal,
    manuallyClosed,
  };
};
