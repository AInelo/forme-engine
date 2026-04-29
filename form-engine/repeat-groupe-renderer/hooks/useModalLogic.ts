import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export const useModalLogic = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [manuallyClosed, setManuallyClosed] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const openModal = (viewMode: boolean = false, allowAutoOpen: boolean = true) => {
    // Si fermé manuellement, ne pas ouvrir automatiquement
    if (!allowAutoOpen && manuallyClosed) {
      return;
    }
    
    setIsViewMode(viewMode);
    setIsModalOpen(true);
    
    // Reset manuallyClosed seulement si ouverture manuelle (allowAutoOpen = true)
    if (allowAutoOpen) {
      setManuallyClosed(false);
    }
  };

  const closeModal = (isManualClose: boolean = false) => {
    if (!modalRef.current) return;
    
    if (isManualClose) {
      setManuallyClosed(true);
    }
    
    const tl = gsap.timeline({
      onComplete: () => {
        setIsModalOpen(false);
        setIsViewMode(false);
      }
    });
    
    tl.to(contentRef.current, { 
      scale: 0.9, 
      opacity: 0, 
      y: 20, 
      duration: 0.15, 
      ease: "power2.in" 
    })
    .to(overlayRef.current, { 
      opacity: 0, 
      duration: 0.1, 
      ease: "power2.in" 
    }, "-=0.05")
    .set(modalRef.current, { display: "none" });
  };

  // Effet pour l'animation d'ouverture
  useEffect(() => {
    if (isModalOpen) {
      gsap.set(modalRef.current, { display: "flex" });
      gsap.set(overlayRef.current, { opacity: 0 });
      gsap.set(contentRef.current, { scale: 0.9, opacity: 0, y: 20 });
      
      const tl = gsap.timeline();
      tl.to(overlayRef.current, { 
        opacity: 1, 
        duration: 0.15, 
        ease: "power2.out" 
      })
      .to(contentRef.current, { 
        scale: 1, 
        opacity: 1, 
        y: 0, 
        duration: 0.2, 
        ease: "power2.out" 
      }, "-=0.05");
    }
  }, [isModalOpen]);

  // Effet pour bloquer le scroll du body
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  return {
    isModalOpen,
    isViewMode,
    modalRef,
    overlayRef,
    contentRef,
    openModal,
    closeModal,
    manuallyClosed
  };
};
