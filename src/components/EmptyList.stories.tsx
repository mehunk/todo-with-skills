import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { AddTodoRow } from "./AddTodoRow";
import { EmptyList } from "./EmptyList";

const meta = {
  title: "Todos/EmptyList",
  component: EmptyList,
  decorators: [
    (Story) => (
      <div className="p-5">
        <div className="max-w-xl rounded-xl border bg-card text-card-foreground shadow-sm">
          {/* The Empty List state sits under the Add Todo row. */}
          <AddTodoRow onSubmit={fn(() => true)} />
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof EmptyList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const EmptyDark: Story = {
  parameters: { themes: { themeOverride: "dark" } },
};
