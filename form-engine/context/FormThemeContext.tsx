import React from "react";

export const DEFAULT_PRIMARY = "#008080";

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
    : null;
}

/** Dérive les 3 CSS variables nécessaires depuis un code hex. */
export function deriveThemeVars(primaryColor: string): React.CSSProperties {
  const rgb = hexToRgb(primaryColor);
  if (!rgb) {
    return {
      "--fe-primary": DEFAULT_PRIMARY,
      "--fe-primary-light": "#e6f7f7",
      "--fe-primary-dark": "#006666",
    } as React.CSSProperties;
  }
  const [r, g, b] = rgb;
  // Light  : mélange 90% blanc — pour les fonds hover/focus
  const light = `rgb(${Math.round(r + (255 - r) * 0.9)},${Math.round(g + (255 - g) * 0.9)},${Math.round(b + (255 - b) * 0.9)})`;
  // Dark : 75% de la valeur — pour les textes accentués
  const dark = `rgb(${Math.round(r * 0.75)},${Math.round(g * 0.75)},${Math.round(b * 0.75)})`;
  return {
    "--fe-primary": primaryColor,
    "--fe-primary-light": light,
    "--fe-primary-dark": dark,
  } as React.CSSProperties;
}

interface FormThemeContextValue {
  primaryColor: string;
}

const FormThemeContext = React.createContext<FormThemeContextValue>({
  primaryColor: DEFAULT_PRIMARY,
});

export const useFormTheme = () => React.useContext(FormThemeContext);

interface FormThemeProviderProps {
  primaryColor?: string;
  children: React.ReactNode;
}

export const FormThemeProvider: React.FC<FormThemeProviderProps> = ({
  primaryColor = DEFAULT_PRIMARY,
  children,
}) => (
  <FormThemeContext.Provider value={{ primaryColor }}>
    {children}
  </FormThemeContext.Provider>
);
