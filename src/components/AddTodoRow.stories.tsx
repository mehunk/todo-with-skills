import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { AddTodoRow } from "./AddTodoRow";

const meta = {
  title: "Todos/AddTodoRow",
  component: AddTodoRow,
  decorators: [
    (Story) => (
      <div className="p-5">
        <div className="max-w-xl rounded-xl border bg-card text-card-foreground shadow-sm">
          <Story />
        </div>
      </div>
    ),
  ],
  args: { onSubmit: fn(() => true), onValueChange: fn() },
} satisfies Meta<typeof AddTodoRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const dark = { themes: { themeOverride: "dark" } };

/** Borderless until focused. */
export const Default: Story = {};

export const DefaultDark: Story = { parameters: dark };

export const Focused: Story = { args: { autoFocus: true } };

export const FocusedDark: Story = { ...Focused, parameters: dark };

/** After pressing Enter with an empty (or whitespace-only) title. */
export const EmptyTitleError: Story = {
  args: { autoFocus: true, error: "Enter a Todo title" },
};

export const EmptyTitleErrorDark: Story = {
  ...EmptyTitleError,
  parameters: dark,
};

export const TooLongError: Story = {
  args: { autoFocus: true, error: "Todo titles can be at most 500 characters" },
};

export const TooLongErrorDark: Story = { ...TooLongError, parameters: dark };
