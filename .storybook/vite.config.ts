import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Storybook only: React + Tailwind. Do not import the app's vite.config.ts.
export default defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [tailwindcss(), react()],
});
