import { createContext, useContext, useState, useEffect } from "react";

const AccessibilityContext = createContext();

const STORAGE_KEYS = {
  REDUCED_MOTION: "cineverse-accessibility-reduced-motion", // "system" | "on" | "off"
  HIGH_CONTRAST: "cineverse-accessibility-high-contrast",   // boolean
  TEXT_SCALE: "cineverse-accessibility-text-scale",         // "normal" | "large" | "x-large"
  LARGE_FOCUS_INDICATOR: "cineverse-accessibility-large-focus", // boolean
};

export function AccessibilityProvider({ children }) {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === "undefined") return "system";
    return localStorage.getItem(STORAGE_KEYS.REDUCED_MOTION) || "system";
  });

  const [highContrast, setHighContrast] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEYS.HIGH_CONTRAST) === "true";
  });

  const [textScale, setTextScale] = useState(() => {
    if (typeof window === "undefined") return "normal";
    return localStorage.getItem(STORAGE_KEYS.TEXT_SCALE) || "normal";
  });

  const [largeFocusIndicator, setLargeFocusIndicator] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEYS.LARGE_FOCUS_INDICATOR) === "true";
  });

  // Manage reduced motion classes
  useEffect(() => {
    const root = document.documentElement;

    function applyMotion(effectiveReduced) {
      if (effectiveReduced) {
        root.classList.add("reduced-motion");
        root.setAttribute("data-reduced-motion", "true");
      } else {
        root.classList.remove("reduced-motion");
        root.removeAttribute("data-reduced-motion");
      }
    }

    if (reducedMotion === "system") {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      applyMotion(mq.matches);
      const handler = (e) => applyMotion(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      applyMotion(reducedMotion === "on");
    }
  }, [reducedMotion]);

  // Manage high contrast classes
  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add("high-contrast");
      root.setAttribute("data-high-contrast", "true");
    } else {
      root.classList.remove("high-contrast");
      root.removeAttribute("data-high-contrast");
    }
  }, [highContrast]);

  // Manage text scaling classes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("text-scale-normal", "text-scale-large", "text-scale-xlarge");
    if (textScale === "large") {
      root.classList.add("text-scale-large");
      root.setAttribute("data-text-scale", "large");
    } else if (textScale === "x-large") {
      root.classList.add("text-scale-xlarge");
      root.setAttribute("data-text-scale", "x-large");
    } else {
      root.classList.add("text-scale-normal");
      root.setAttribute("data-text-scale", "normal");
    }
  }, [textScale]);

  // Manage focus indicator styles
  useEffect(() => {
    const root = document.documentElement;
    if (largeFocusIndicator) {
      root.classList.add("large-focus-indicator");
      root.setAttribute("data-large-focus", "true");
    } else {
      root.classList.remove("large-focus-indicator");
      root.removeAttribute("data-large-focus");
    }
  }, [largeFocusIndicator]);

  const updateReducedMotion = (val) => {
    setReducedMotion(val);
    localStorage.setItem(STORAGE_KEYS.REDUCED_MOTION, val);
  };

  const updateHighContrast = (val) => {
    setHighContrast(val);
    localStorage.setItem(STORAGE_KEYS.HIGH_CONTRAST, String(val));
  };

  const updateTextScale = (val) => {
    setTextScale(val);
    localStorage.setItem(STORAGE_KEYS.TEXT_SCALE, val);
  };

  const updateLargeFocusIndicator = (val) => {
    setLargeFocusIndicator(val);
    localStorage.setItem(STORAGE_KEYS.LARGE_FOCUS_INDICATOR, String(val));
  };

  const resetAccessibility = () => {
    updateReducedMotion("system");
    updateHighContrast(false);
    updateTextScale("normal");
    updateLargeFocusIndicator(false);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        reducedMotion,
        setReducedMotion: updateReducedMotion,
        highContrast,
        setHighContrast: updateHighContrast,
        textScale,
        setTextScale: updateTextScale,
        largeFocusIndicator,
        setLargeFocusIndicator: updateLargeFocusIndicator,
        resetAccessibility,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within AccessibilityProvider");
  }
  return context;
}
