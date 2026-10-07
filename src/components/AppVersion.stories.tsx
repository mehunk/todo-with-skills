import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppVersion } from "./AppVersion";

const meta = {
  title: "App/AppVersion",
  component: AppVersion,
} satisfies Meta<typeof AppVersion>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The version from package.json. Check it in both themes. */
export const Default: Story = {};

/** A long version must not break a narrow layout. */
export const LongNarrow: Story = {
  args: { version: "v10.20.30-beta.1+build.12345" },
  decorators: [
    (Story) => (
      <div className="w-32">
        <Story />
      </div>
    ),
  ],
};
