import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, within } from "storybook/test";
import { TodoActions } from "./TodoActions";
import { TodoRow } from "./TodoRow";

const meta = {
  title: "Todos/TodoRow",
  component: TodoRow,
  decorators: [
    (Story) => (
      <div className="p-5">
        <div className="max-w-xl rounded-xl border bg-card text-card-foreground shadow-sm">
          <Story />
        </div>
      </div>
    ),
  ],
  args: {
    todo: { id: "1", title: "Buy oat milk", completed: false },
    onCompletedChange: fn(),
  },
} satisfies Meta<typeof TodoRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const dark = { themes: { themeOverride: "dark" } };

export const NotCompleted: Story = {};

export const NotCompletedDark: Story = { parameters: dark };

/** Long titles wrap instead of being cut off. */
export const LongTitle: Story = {
  args: {
    todo: {
      id: "1",
      title:
        "Call the landlord about the leaking kitchen tap, then book a plumber for a weekday morning and send the invoice to the building manager",
      completed: false,
    },
  },
};

export const LongTitleDark: Story = { ...LongTitle, parameters: dark };

/** Just added and not saved yet: muted, checkbox disabled. */
export const Saving: Story = { args: { saving: true } };

export const SavingDark: Story = { ...Saving, parameters: dark };

/** On a phone the row and the checkbox's tap target are at least 44px. */
export const Phone: Story = {
  globals: { viewport: { value: "mobile1" } },
};

export const PhoneDark: Story = { ...Phone, parameters: dark };

const deleteAction = (
  <TodoActions todoTitle="Buy oat milk" onDelete={fn().mockName("onDelete")} />
);

/**
 * Hovered on desktop: `bg-muted/50`, and the Delete action fades in. CSS
 * hover can't be forced in a story, so the row gets the hover background and
 * Delete holds focus, which reveals it the same way.
 */
export const Hover: Story = {
  args: { actions: deleteAction, className: "bg-muted/50" },
  play: async ({ canvasElement }) => {
    within(canvasElement)
      .getByRole("button", { name: "Delete Buy oat milk" })
      .focus();
  },
};

export const HoverDark: Story = { ...Hover, parameters: dark };

/** On a phone a per-row `⋯` menu, always visible, holds Delete. */
export const Mobile: Story = {
  args: { actions: deleteAction },
  globals: { viewport: { value: "mobile1" } },
};

export const MobileDark: Story = { ...Mobile, parameters: dark };
