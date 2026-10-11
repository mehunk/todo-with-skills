import type { Meta, StoryObj } from "@storybook/react-vite";
import { ListHeader } from "./ListHeader";

const meta = {
  title: "Todos/ListHeader",
  component: ListHeader,
  decorators: [
    (Story) => (
      <div className="p-5">
        <header className="flex min-h-14 max-w-md items-center gap-2 rounded-xl border bg-card px-4 py-3 text-card-foreground shadow-sm">
          <Story />
        </header>
      </div>
    ),
  ],
  args: { name: "Groceries", openCount: 3 },
} satisfies Meta<typeof ListHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

const dark = { themes: { themeOverride: "dark" } };

export const WithOpenTodos: Story = {};

export const WithOpenTodosDark: Story = { parameters: dark };

/** An empty List, or one whose Todos are all Completed. */
export const NoneOpen: Story = { args: { openCount: 0 } };

export const NoneOpenDark: Story = { ...NoneOpen, parameters: dark };

/** Long List names are truncated; the count stays visible. */
export const LongName: Story = {
  args: {
    name: "Everything that needs doing before the move to the new flat in spring",
    openCount: 128,
  },
};

export const LongNameDark: Story = { ...LongName, parameters: dark };
