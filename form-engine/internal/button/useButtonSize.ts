import { useEffect, useState } from "react";

const WIDTH_MOBILE = 120;
const SCREEN_MOBILE = 320;
const WIDTH_DESKTOP = 233;
const SCREEN_DESKTOP = 2560;

export function useButtonSize() {
  const [width, setWidth] = useState(120);
  const [height, setHeight] = useState(36);
  const [borderRadius, setBorderRadius] = useState(16);
  const [pressed, setPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => {
      const sw = window.innerWidth;
      const a = (WIDTH_DESKTOP - WIDTH_MOBILE) / (SCREEN_DESKTOP - SCREEN_MOBILE);
      const b = WIDTH_MOBILE - a * SCREEN_MOBILE;
      const w = a * sw + b;
      const h = w * 0.3;
      setWidth(w);
      setHeight(h);
      setBorderRadius(h * (30 / 66));
      setIsMobile(sw < 1024);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const transform = pressed
    ? "scale(0.95)"
    : isHovered && !isMobile
    ? "scale(1.02)"
    : "scale(1)";

  const handlers = {
    onMouseDown: () => setPressed(true),
    onMouseUp: () => setPressed(false),
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => {
      setPressed(false);
      setIsHovered(false);
    },
    onTouchStart: () => isMobile && setPressed(true),
    onTouchEnd: () => isMobile && setPressed(false),
  };

  return { width, height, borderRadius, pressed, isHovered, isMobile, transform, handlers };
}
