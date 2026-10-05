import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-themes"],
  framework: {
    name: "@storybook/react-vite",
    options: {
      // Storybook's own Vite config (React + Tailwind only). The app's
      // vite.config.ts loads TanStack Start, Cloudflare and devtools plugins,
      // which must not run inside Storybook.
      builder: { viteConfigPath: ".storybook/vite.config.ts" },
    },
  },
  core: { disableTelemetry: true },
};

export default config;
