import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { ClearCompleted } from "./ClearCompleted";

const meta = {
  title: "Todos/ClearCompleted",
  component: ClearCompleted,
  decorators: [
    (Story) => (
      <div className="p-5">
        <Story />
      </div>
    ),
  ],
  args: { count: 2, onConfirm: fn() },
} satisfies Meta<typeof ClearCompleted>;

export default meta;
type Story = StoryObj<typeof meta>;

const dark = { themes: { themeOverride: "dark" } };

/** The "Clear Completed" button; clicking it opens the confirmation. */
export const Button: Story = {};

export const ButtonDark: Story = { parameters: dark };

/** The confirmation dialog: destructive "Clear Completed" and Cancel. */
export const ConfirmationDialog: Story = { args: { defaultOpen: true } };

export const ConfirmationDialogDark: Story = {
  ...ConfirmationDialog,
  parameters: dark,
};

/** The confirmation for a single Completed Todo. */
export const ConfirmationDialogOneTodo: Story = {
  args: { defaultOpen: true, count: 1 },
};
