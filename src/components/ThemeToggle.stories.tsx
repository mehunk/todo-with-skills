import type { Meta, StoryObj } from "@storybook/react-vite";
import { THEME_STORAGE_KEY, type ThemeMode } from "#/lib/theme";
import ThemeToggle from "./ThemeToggle";

/**
 * Cycles light → dark → system. Each story starts from a stored mode; clicking
 * changes the whole preview. The previous stored mode is restored afterwards.
 */
const meta = {
  title: "App/ThemeToggle",
  component: ThemeToggle,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

function startingFrom(mode: ThemeMode): Story["beforeEach"] {
  return () => {
    const previous = window.localStorage.getItem(THEME_STORAGE_KEY);
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    return () => {
      if (previous === null) window.localStorage.removeItem(THEME_STORAGE_KEY);
      else window.localStorage.setItem(THEME_STORAGE_KEY, previous);
    };
  };
}

// themeOverride keeps the toolbar theme decorator in step with the stored mode.
export const Light: Story = {
  beforeEach: startingFrom("light"),
  parameters: { themes: { themeOverride: "light" } },
};

export const Dark: Story = {
  beforeEach: startingFrom("dark"),
  parameters: { themes: { themeOverride: "dark" } },
};

/** Follows the OS colour scheme (the preview keeps the toolbar's theme). */
export const Auto: Story = { beforeEach: startingFrom("auto") };
