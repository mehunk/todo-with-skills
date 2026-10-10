import type { Meta, StoryObj } from "@storybook/react-vite";
import { MainHeader } from "./MainHeader";

const meta = {
  title: "Lists/MainHeader",
  component: MainHeader,
  decorators: [
    (Story) => (
      <div className="p-5">
        <header className="flex min-h-14 max-w-md items-center gap-2 rounded-xl border bg-card px-4 py-3 text-card-foreground shadow-sm">
          <Story />
        </header>
      </div>
    ),
  ],
  args: { title: "Groceries" },
} satisfies Meta<typeof MainHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ListName: Story = {};

/** Long List names are truncated on one line. */
export const LongListName: Story = {
  args: {
    title:
      "Everything that needs doing before the move to the new flat in spring",
  },
};

/** No List selected (the "No Lists" empty state). */
export const NoListSelected: Story = { args: { title: "Todo" } };
