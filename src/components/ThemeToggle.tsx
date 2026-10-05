import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import {
  applyThemeMode,
  getStoredThemeMode,
  storeThemeMode,
  type ThemeMode,
} from "#/lib/theme";

const NEXT_MODE: Record<ThemeMode, ThemeMode> = {
  light: "dark",
  dark: "auto",
  auto: "light",
};

const ICON: Record<ThemeMode, typeof SunIcon> = {
  light: SunIcon,
  dark: MoonIcon,
  auto: MonitorIcon,
};

/** Cycles light → dark → auto (system). */
export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("auto");

  useEffect(() => {
    const initial = getStoredThemeMode();
    setMode(initial);
    applyThemeMode(initial);
  }, []);

  useEffect(() => {
    if (mode !== "auto") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyThemeMode("auto");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [mode]);

  function toggle() {
    const next = NEXT_MODE[mode];
    setMode(next);
    applyThemeMode(next);
    storeThemeMode(next);
  }

  const label =
    mode === "auto"
      ? "Theme: system. Switch to light"
      : `Theme: ${mode}. Switch to ${NEXT_MODE[mode] === "auto" ? "system" : NEXT_MODE[mode]}`;
  const Icon = ICON[mode];

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <Icon className="size-4" />
    </Button>
  );
}
