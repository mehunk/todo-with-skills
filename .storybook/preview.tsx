import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview, ReactRenderer } from "@storybook/react-vite";
import { Toaster } from "../src/components/ui/sonner";
import "../src/styles.css";

const preview: Preview = {
	parameters: {
		layout: "fullscreen",
	},
	decorators: [
		(Story) => (
			<>
				<Story />
				<Toaster />
			</>
		),
		// Puts the `dark` class on <html>, like the app's theme toggle.
		withThemeByClassName<ReactRenderer>({
			themes: { light: "light", dark: "dark" },
			defaultTheme: "light",
		}),
	],
};

export default preview;
