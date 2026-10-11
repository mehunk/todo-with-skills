import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, within } from "storybook/test";
import { TodoActions } from "./TodoActions";

const meta = {
  title: "Todos/TodoActions",
  component: TodoActions,
  decorators: [
    (Story) => (
      // A row stand-in: the Delete action fades in on the row's hover/focus.
      <div className="p-5">
        <div className="group flex max-w-xl items-center justify-between rounded-xl border bg-card px-4 py-1 text-sm text-card-foreground shadow-sm">
          Buy oat milk
          <Story />
        </div>
      </div>
    ),
  ],
  args: { todoTitle: "Buy oat milk", onDelete: fn() },
} satisfies Meta<typeof TodoActions>;

export default meta;
type Story = StoryObj<typeof meta>;

const dark = { themes: { themeOverride: "dark" } };

/**
 * From `md` up: a Delete icon button, shown while the row is hovered or holds
 * focus (always, on touch screens). CSS hover can't be forced in a story, so
 * Delete holds focus, which reveals it the same way.
 */
export const Desktop: Story = {
  play: async ({ canvasElement }) => {
    within(canvasElement)
      .getByRole("button", { name: "Delete Buy oat milk" })
      .focus();
  },
};

export const DesktopDark: Story = { ...Desktop, parameters: dark };

/** Below `md`: the always-visible `⋯` menu, opened, holding Delete. */
export const MobileMenuOpen: Story = {
  globals: { viewport: { value: "mobile1" } },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: "Actions for Buy oat milk",
      }),
    );
    await expect(
      await screen.findByRole("menuitem", { name: "Delete" }),
    ).toBeVisible();
  },
};

export const MobileMenuOpenDark: Story = {
  ...MobileMenuOpen,
  parameters: dark,
};
