import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { NoLists } from "./NoLists";

const meta = {
  title: "Lists/NoLists",
  component: NoLists,
  decorators: [
    (Story) => (
      <div className="flex min-h-dvh flex-col bg-muted/50 p-5">
        <div className="flex flex-1 flex-col rounded-xl border bg-card text-card-foreground shadow-sm">
          <Story />
        </div>
      </div>
    ),
  ],
  args: { onCreate: fn(), onNameChange: fn() },
} satisfies Meta<typeof NoLists>;

export default meta;
type Story = StoryObj<typeof meta>;

const dark = { themes: { themeOverride: "dark" } };

export const Empty: Story = {};

export const EmptyDark: Story = { parameters: dark };

/** After pressing Enter with an empty (or whitespace-only) name. */
export const WithValidationError: Story = {
  args: { error: "Enter a List name" },
};

export const WithValidationErrorDark: Story = {
  args: { error: "Enter a List name" },
  parameters: dark,
};
