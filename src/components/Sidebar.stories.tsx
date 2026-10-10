import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { Sidebar } from "./Sidebar";

const meta = {
  title: "Lists/Sidebar",
  component: Sidebar,
  decorators: [
    (Story) => (
      <div className="min-h-dvh bg-muted/50 p-5">
        <div className="flex w-64 flex-col rounded-xl border bg-card p-2 text-card-foreground shadow-sm">
          <Story />
        </div>
      </div>
    ),
  ],
  args: { lists: [], onSelectList: fn(), onAddList: fn() },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

const dark = { themes: { themeOverride: "dark" } };

const lists = [
  { id: "groceries", name: "Groceries" },
  { id: "work", name: "Work" },
  { id: "home", name: "Home" },
  { id: "reading", name: "Reading" },
];

const longName = {
  id: "long",
  name: "A List with a very long name that cannot possibly fit in the sidebar",
};

export const NoLists: Story = {};

export const NoListsDark: Story = { parameters: dark };

export const SeveralLists: Story = {
  args: { lists, selectedListId: "work" },
};

export const SeveralListsDark: Story = {
  args: { lists, selectedListId: "work" },
  parameters: dark,
};

/** Long names are truncated, whether selected or not. */
export const LongNamesTruncated: Story = {
  args: {
    lists: [longName, ...lists, { ...longName, id: "long-2" }],
    selectedListId: "long-2",
  },
};

export const LongNamesTruncatedDark: Story = {
  ...LongNamesTruncated,
  parameters: dark,
};

/** Below `sm`, rows and the `+` button are at least 44px tall. */
export const Mobile: Story = {
  args: { lists, selectedListId: "work" },
  globals: { viewport: { value: "mobile1" } },
};
