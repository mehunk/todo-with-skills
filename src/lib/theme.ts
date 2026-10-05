import { useEffect, useState } from "react";

/**
 * Light / dark theme handling. The resolved theme is a `light` or `dark` class
 * on <html>; the inline init script in `__root.tsx` applies it before paint.
 */
export const THEME_MODES = ["light", "dark", "auto"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];
export type ResolvedTheme = "light" | "dark";

/** localStorage key holding the chosen ThemeMode. */
export const THEME_STORAGE_KEY = "theme";

const DEFAULT_MODE: ThemeMode = "auto";

function isThemeMode(value: unknown): value is ThemeMode {
  return (THEME_MODES as readonly unknown[]).includes(value);
}

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(stored) ? stored : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

function prefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyThemeMode(mode: ThemeMode) {
  const resolved: ResolvedTheme =
    mode === "auto" ? (prefersDark() ? "dark" : "light") : mode;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  if (mode === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", mode);
  root.style.colorScheme = resolved;
}

export function storeThemeMode(mode: ThemeMode) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts for this page only.
  }
}

/**
 * Inline script for <head> that applies the stored theme before first paint.
 * It mirrors `getStoredThemeMode` + `applyThemeMode` (it cannot import them)
 * and is built from the same constants so the two cannot drift.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var modes=${JSON.stringify(THEME_MODES)};var stored=window.localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var mode=modes.indexOf(stored)>=0?stored:${JSON.stringify(DEFAULT_MODE)};var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

/** The theme currently applied to <html>, kept in sync as it changes. */
export function useResolvedTheme(): ResolvedTheme {
  const [theme, setTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const root = document.documentElement;
    const read = () =>
      setTheme(root.classList.contains("dark") ? "dark" : "light");
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return theme;
}
