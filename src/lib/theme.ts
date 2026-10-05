import { useEffect, useState } from "react";

/**
 * Light / dark theme handling. The resolved theme is a `light` or `dark` class
 * on <html>; the inline init script in `__root.tsx` applies it before paint.
 */
export type ThemeMode = "light" | "dark" | "auto";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme";

function isThemeMode(value: unknown): value is ThemeMode {
	return value === "light" || value === "dark" || value === "auto";
}

export function getStoredThemeMode(): ThemeMode {
	if (typeof window === "undefined") return "auto";
	try {
		const stored = window.localStorage.getItem(STORAGE_KEY);
		return isThemeMode(stored) ? stored : "auto";
	} catch {
		return "auto";
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
		window.localStorage.setItem(STORAGE_KEY, mode);
	} catch {
		// Storage can be unavailable (private mode); the choice then lasts for this page only.
	}
}

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
