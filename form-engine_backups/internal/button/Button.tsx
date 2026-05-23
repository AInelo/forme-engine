import React, { useEffect, useState } from "react";

type ButtonVariant = "validation" | "cancel" | "red-flag";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  intent?: "validation" | "cancel";
}

const WIDTH_MOBILE = 120;
const SCREEN_MOBILE = 320;
const WIDTH_DESKTOP = 233;
const SCREEN_DESKTOP = 2560;

const NORMAL_SHADOW = `inset 0 -2px 6px rgba(0,0,0,0.1),inset -2px 0 4px rgba(255,255,255,0.3),inset 2px 0 4px rgba(0,0,0,0.3),inset 0 -6px 4px rgba(0,0,0,0.1),inset 0 6px 4px rgba(255,255,255,0.3)`;
const PRESSED_SHADOW = `inset 0 -1px 3px rgba(0,0,0,0.1),inset -1px 0 2px rgba(255,255,255,0.3),inset 1px 0 2px rgba(0,0,0,0.3),inset 0 -3px 2px rgba(0,0,0,0.1),inset 0 3px 2px rgba(255,255,255,0.3)`;

const variantClasses: Record<ButtonVariant, string> = {
  validation: "bg-primary text-white",
  cancel: "bg-white text-primary border border-gray-300",
  "red-flag": "bg-red-600 text-white hover:bg-red-700",
};

const Button: React.FC<ButtonProps> = ({ children, className, variant = "validation", intent, onClick, ...props }) => {
  const effectiveVariant: ButtonVariant = intent === "cancel" ? "cancel" : intent === "validation" ? "validation" : variant;

  const [height, setHeight] = useState(36);
  const [width, setWidth] = useState(120);
  const [pressed, setPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => {
      const sw = window.innerWidth;
      const a = (WIDTH_DESKTOP - WIDTH_MOBILE) / (SCREEN_DESKTOP - SCREEN_MOBILE);
      const b = WIDTH_MOBILE - a * SCREEN_MOBILE;
      const w = a * sw + b;
      setWidth(w);
      setHeight(w * 0.3);
      setIsMobile(sw < 1024);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const borderRadius = height * (30 / 66);
  const scale = pressed ? "scale(0.90)" : isHovered && !isMobile ? "scale(1.05)" : "scale(1)";

  return (
    <button
      style={{
        height: `${height}px`,
        borderRadius: `${borderRadius}px`,
        boxShadow: pressed ? PRESSED_SHADOW : NORMAL_SHADOW,
        transform: scale,
        transition: "box-shadow 0.2s ease, transform 0.3s ease-out",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
      }}
      className={`inline-flex items-center justify-center px-5 font-medium group relative overflow-hidden ${variantClasses[effectiveVariant]} ${className ?? ""}`}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setPressed(false); setIsHovered(false); }}
      onTouchStart={() => isMobile && setPressed(true)}
      onTouchEnd={() => isMobile && setPressed(false)}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
