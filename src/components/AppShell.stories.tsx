import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";
import { fn } from "storybook/test";
import { AppShell } from "./AppShell";
import { MainHeader } from "./MainHeader";
import { NoLists } from "./NoLists";
import { Sidebar } from "./Sidebar";
import { Button } from "./ui/button";

const meta = {
  title: "App/AppShell",
  component: AppShell,
  decorators: [
    (Story) => (
      <div className="flex min-h-dvh flex-col">
        <Story />
      </div>
    ),
  ],
  args: {
    sidebar: <Sidebar lists={[]} onSelectList={fn()} />,
    header: <MainHeader title="Todo" />,
    children: <NoLists onCreate={fn()} />,
  },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  globals: { viewport: { value: "desktop" } },
};

/** Below `md` the sidebar card is hidden behind the menu button. */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile1" } },
};

/** Below `md`, the drawer opened from the menu button. */
export const MobileDrawerOpen: Story = {
  globals: { viewport: { value: "mobile1" } },
  args: { defaultDrawerOpen: true },
};

const lists = [
  { id: "groceries", name: "Groceries" },
  { id: "work", name: "Work" },
];

/** A List selected: its name in the header, highlighted in the sidebar. */
export const WithLists: Story = {
  args: {
    sidebar: (
      <Sidebar lists={lists} selectedListId="work" onSelectList={fn()} />
    ),
    header: <MainHeader title="Work" />,
    children: <div className="flex-1" />,
  },
};

export const MobileDrawerOpenWithLists: Story = {
  ...WithLists,
  globals: { viewport: { value: "mobile1" } },
  args: { ...WithLists.args, defaultDrawerOpen: true },
};

/** The root Toaster reports failures; any component can call `toast`. */
export const WithToast: Story = {
  args: {
    children: (
      <div className="flex flex-1 items-center justify-center p-4">
        <Button
          variant="outline"
          onClick={() => toast.error("Couldn't save — try again")}
        >
          Show failure toast
        </Button>
      </div>
    ),
  },
};
