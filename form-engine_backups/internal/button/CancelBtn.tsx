import React, { useEffect, useState } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const WIDTH_MOBILE = 120;
const SCREEN_MOBILE = 320;
const WIDTH_DESKTOP = 233;
const SCREEN_DESKTOP = 2560;

const NORMAL_SHADOW = `inset 0px -2px 6px rgba(0,0,0,0.1),inset -2px 0px 4px rgba(255,255,255,0.3),inset 2px 0px 4px rgba(0,0,0,0.3),inset 0px -6px 4px rgba(0,0,0,0.1),inset 0px 6px 4px rgba(255,255,255,0.3)`;
const PRESSED_SHADOW = `inset 0px -1px 3px rgba(0,0,0,0.1),inset -1px 0px 2px rgba(255,255,255,0.3),inset 1px 0px 2px rgba(0,0,0,0.3),inset 0px -3px 2px rgba(0,0,0,0.1),inset 0px 3px 2px rgba(255,255,255,0.3)`;

const CancelBtn: React.FC<ButtonProps> = ({ children, className, onClick, ...props }) => {
  const [height, setHeight] = useState(50);
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

  const content = (
    <span className="text-center text-primary font-bold flex items-center justify-center gap-2">
      {children}
    </span>
  );

  return (
    <button
      style={{
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: `${borderRadius}px`,
        boxShadow: pressed ? PRESSED_SHADOW : NORMAL_SHADOW,
        transform: scale,
        transition: "box-shadow 0.2s ease, transform 0.3s ease-out",
        overflow: "hidden",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
      }}
      className={`bg-white px-7 group relative ${className ?? ""}`}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setPressed(false); setIsHovered(false); }}
      onTouchStart={() => isMobile && setPressed(true)}
      onTouchEnd={() => isMobile && setPressed(false)}
      onClick={onClick}
      {...props}
    >
      <span className="relative overflow-hidden w-full h-full flex items-center justify-center">
        <span
          className={`flex items-center justify-center transition-transform duration-300 w-full h-full ${isMobile ? "" : "group-hover:translate-x-full"}`}
          style={isMobile ? { transform: pressed ? "translateX(100%)" : "translateX(0)" } : {}}
        >
          {content}
        </span>
        <span
          className={`flex items-center justify-center absolute top-0 w-full h-full transition-transform duration-300 ${isMobile ? "" : "group-hover:translate-x-[100%]"}`}
          style={{ left: "-100%", ...(isMobile ? { transform: pressed ? "translateX(100%)" : "translateX(0)" } : {}) }}
        >
          {content}
        </span>
      </span>
    </button>
  );
};

export default CancelBtn;
