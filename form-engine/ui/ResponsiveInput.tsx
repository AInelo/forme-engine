
import React, { useEffect, useState } from "react";
import ClassNames from "classnames";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'fixed' | 'fluid' | 'proportional';
  minWidth?: number;
  maxWidth?: number;
}

const ResponsiveInput: React.FC<InputProps> = ({ 
  className, 
  variant = 'proportional',
  minWidth = 200,
  maxWidth = 600,
  ...props 
}) => {
  // Fonction pour calculer la taille
  const calculateSize = (screenWidth: number) => {
    // Points de référence
    const WidthMobileM = minWidth; // 200px sur mobile
    const ScreenWidthMobileM = 320;
    const WidthKscreen = maxWidth; // 600px sur 4K
    const ScreenWidthKscreen = 2560;
    
    // Calcul linéaire
    const a = (WidthKscreen - WidthMobileM) / (ScreenWidthKscreen - ScreenWidthMobileM);
    const b = WidthMobileM - (a * ScreenWidthMobileM);
    
    let width: number;
    let height: number;
    
    switch (variant) {
      case 'fixed':
        // Largeur fixe avec des breakpoints
        if (screenWidth < 425) width = 280;
        else if (screenWidth < 768) width = 350;
        else if (screenWidth < 1024) width = 400;
        else width = 450;
        break;
        
      case 'fluid':
        // Largeur en pourcentage de l'écran
        width = Math.max(minWidth, Math.min(maxWidth, screenWidth * 0.8));
        break;
        
      case 'proportional':
      default:
        // Largeur proportionnelle (comme ton bouton)
        width = Math.max(minWidth, Math.min(maxWidth, a * screenWidth + b));
        break;
    }
    
    // Hauteur proportionnelle à la largeur (ratio golden ou custom)
    height = Math.max(35, width * 0.12); // 12% de la largeur
    
    return { width, height };
  };

  // Initialiser avec la bonne taille dès le départ
  const [size, setSize] = useState(() => {
    // Vérifier si on est côté client
    if (typeof window !== 'undefined') {
      return calculateSize(window.innerWidth);
    }
    // Fallback pour le SSR
    return { width: minWidth, height: 45 };
  });

  useEffect(() => {
    const updateSize = () => {
      const screenWidth = window.innerWidth;
      setSize(calculateSize(screenWidth));
    };

    // Ne pas faire updateSize() ici car on a déjà la bonne taille
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [variant, minWidth, maxWidth]);

  return (
    <input
      style={{ 
        width: `${size.width}px`, 
        height: `${size.height}px` 
      }}
      className={ClassNames(
        `rounded-xl border-2 border-gray-300 px-4 py-2
        font-ubuntu text-base
        bg-white text-gray-800
        focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-opacity-50
        transition-all duration-300
        shadow-sm hover:shadow-md focus:shadow-lg
        placeholder:text-gray-400`,
        className
      )}
      {...props}
    />
  );
};

export default ResponsiveInput;