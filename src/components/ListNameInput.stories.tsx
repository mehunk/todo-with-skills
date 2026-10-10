import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { ListNameInput } from "./ListNameInput";

const meta = {
  title: "Lists/ListNameInput",
  component: ListNameInput,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
  args: { onSubmit: fn(), onCancel: fn(), onValueChange: fn() },
} satisfies Meta<typeof ListNameInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const dark = { themes: { themeOverride: "dark" } };

export const Default: Story = {};

export const DefaultDark: Story = { parameters: dark };

export const Focused: Story = { args: { autoFocus: true } };

export const FocusedDark: Story = { ...Focused, parameters: dark };

export const EmptyNameError: Story = {
  args: { error: "Enter a List name" },
};

export const EmptyNameErrorDark: Story = {
  ...EmptyNameError,
  parameters: dark,
};

export const TooLongError: Story = {
  args: { error: "List names can be at most 100 characters" },
};

export const TooLongErrorDark: Story = { ...TooLongError, parameters: dark };
