import React from "react";
import { cn } from "../../lib/utils";
import { useButtonSize } from "./useButtonSize";

type ButtonVariant = "validation" | "cancel" | "red-flag";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  intent?: "validation" | "cancel";
}

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "validation",
  intent,
  onClick,
  ...props
}) => {
  const effectiveVariant: ButtonVariant =
    intent === "cancel" ? "cancel" : intent === "validation" ? "validation" : variant;

  const { height, borderRadius, transform, handlers } = useButtonSize();

  const isCancel = effectiveVariant === "cancel";
  const isRedFlag = effectiveVariant === "red-flag";

  return (
    <button
      style={{
        height: `${height}px`,
        borderRadius: `${borderRadius}px`,
        ...(isCancel
          ? { borderColor: "var(--fe-primary)" }
          : !isRedFlag
          ? { backgroundColor: "var(--fe-primary)" }
          : {}),
        transform,
        transition: "transform 0.2s ease, opacity 0.15s ease, background-color 0.15s ease",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
      }}
      className={cn(
        "inline-flex items-center justify-center px-5",
        "text-sm font-medium whitespace-nowrap",
        "shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "cursor-pointer relative overflow-hidden",
        isCancel && [
          "bg-white border",
          "focus-visible:ring-[var(--fe-primary)]",
          "hover:bg-[var(--fe-primary-light)]",
        ],
        !isCancel && !isRedFlag && [
          "text-white",
          "focus-visible:ring-[var(--fe-primary)]",
          "hover:opacity-90",
        ],
        isRedFlag && [
          "bg-red-600 text-white",
          "focus-visible:ring-red-600",
          "hover:bg-red-700",
        ],
        className
      )}
      {...handlers}
      onClick={onClick}
      {...props}
    >
      <span
        style={isCancel ? { color: "var(--fe-primary)" } : undefined}
        className="inline-flex items-center justify-center gap-2"
      >
        {children}
      </span>
    </button>
  );
};

export default Button;
