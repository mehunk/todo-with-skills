import type { Meta, StoryObj } from "@storybook/react-vite";
import ThemeToggle from "./ThemeToggle";

/** Cycles light → dark → system. Clicking it changes the whole preview. */
const meta = {
	title: "App/ThemeToggle",
	component: ThemeToggle,
	parameters: { layout: "centered" },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
