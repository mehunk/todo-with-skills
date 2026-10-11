import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { CompletedSection } from "./CompletedSection";
import { TodoRow } from "./TodoRow";

const completed = [
  { id: "1", title: "Buy oat milk", completed: true },
  { id: "2", title: "Return the library books", completed: true },
];

const meta = {
  title: "Todos/CompletedSection",
  component: CompletedSection,
  decorators: [
    (Story) => (
      <div className="p-5">
        <div className="max-w-xl rounded-xl border bg-card text-card-foreground shadow-sm">
          {/* The Completed section sits below the open Todos. */}
          <TodoRow
            todo={{ id: "3", title: "Book the dentist", completed: false }}
            onCompletedChange={fn()}
          />
          <Story />
        </div>
      </div>
    ),
  ],
  args: {
    count: completed.length,
    children: (
      <ul aria-label="Completed">
        {completed.map((todo) => (
          <li key={todo.id}>
            <TodoRow todo={todo} onCompletedChange={fn()} />
          </li>
        ))}
      </ul>
    ),
  },
} satisfies Meta<typeof CompletedSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const dark = { themes: { themeOverride: "dark" } };

/** Expanded by default: the Completed Todos are shown. */
export const Expanded: Story = {};

export const ExpandedDark: Story = { parameters: dark };

/** Collapsed: only the "Completed (N)" toggle. */
export const Collapsed: Story = { args: { defaultExpanded: false } };

export const CollapsedDark: Story = { ...Collapsed, parameters: dark };

/** With "Clear Completed" beside the toggle, as in a List. */
export const WithClearCompleted: Story = {
  args: { onClearCompleted: fn() },
};

export const WithClearCompletedDark: Story = {
  ...WithClearCompleted,
  parameters: dark,
};

/** Collapsed, still with "Clear Completed" beside the toggle. */
export const CollapsedWithClearCompleted: Story = {
  args: { defaultExpanded: false, onClearCompleted: fn() },
};
