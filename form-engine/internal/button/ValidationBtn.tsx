import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { useButtonSize } from "./useButtonSize";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const ValidationBtn: React.FC<ButtonProps> = ({ children, className, onClick, ...props }) => {
  const { width } = useButtonSize();

  return (
    <button
      style={{
        width: `${width}px`,
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
      }}
      className={cn(
        "group relative h-auto cursor-pointer overflow-hidden rounded-full py-2 px-5",
        "inline-flex items-center justify-center",
        "border border-[var(--fe-primary)]",
        "text-sm font-semibold whitespace-nowrap",
        "shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fe-primary)] focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {/* Texte initial qui sort vers la droite */}
      <span className="inline-block translate-x-0 pl-2 transition-all duration-300 group-hover:translate-x-full group-hover:opacity-0 text-[var(--fe-primary)]">
        {children}
      </span>

      {/* Texte + flèche qui entrent depuis la gauche */}
      <div className="absolute top-0 z-10 flex h-full w-full translate-x-full items-center justify-center gap-2 text-white opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
        <span>{children}</span>
        <ArrowRight className="w-4 h-4" />
      </div>

      {/* Cercle qui s'étend pour remplir le bouton */}
      <div
        className="absolute left-3 top-1/2 h-2 w-2 -translate-y-1/2 scale-100 rounded-full transition-all duration-300 group-hover:left-0 group-hover:top-0 group-hover:h-full group-hover:w-full group-hover:translate-y-0 group-hover:scale-[1.8]"
        style={{ backgroundColor: "var(--fe-primary)" }}
      />
    </button>
  );
};

export default ValidationBtn;
