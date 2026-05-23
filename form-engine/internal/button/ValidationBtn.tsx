import React from "react";
import { cn } from "../../lib/utils";
import { useButtonSize } from "./useButtonSize";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const ValidationBtn: React.FC<ButtonProps> = ({ children, className, onClick, ...props }) => {
  const { width, height, borderRadius, pressed, isMobile, transform, handlers } = useButtonSize();

  const content = (
    <span className="inline-flex items-center justify-center gap-2 text-white font-medium text-sm">
      {children}
    </span>
  );

  return (
    <button
      style={{
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: `${borderRadius}px`,
        backgroundColor: "var(--fe-primary)",
        transform,
        transition: "transform 0.2s ease, opacity 0.15s ease",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
      }}
      className={cn(
        "inline-flex items-center justify-center px-6",
        "text-sm font-medium whitespace-nowrap",
        "shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fe-primary)] focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "cursor-pointer overflow-hidden relative group",
        "hover:opacity-90",
        className
      )}
      {...handlers}
      onClick={onClick}
      {...props}
    >
      <span className="relative overflow-hidden w-full h-full flex items-center justify-center">
        <span
          className={cn(
            "flex items-center justify-center transition-transform duration-300 w-full h-full",
            !isMobile && "group-hover:translate-x-full"
          )}
          style={isMobile ? { transform: pressed ? "translateX(100%)" : "translateX(0)" } : {}}
        >
          {content}
        </span>
        <span
          className={cn(
            "flex items-center justify-center absolute top-0 w-full h-full transition-transform duration-300",
            !isMobile && "group-hover:translate-x-[100%]"
          )}
          style={{
            left: "-100%",
            ...(isMobile ? { transform: pressed ? "translateX(100%)" : "translateX(0)" } : {}),
          }}
        >
          {content}
        </span>
      </span>
    </button>
  );
};

export default ValidationBtn;
