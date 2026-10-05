import type { Meta, StoryObj } from "@storybook/react-vite";
import Footer from "./Footer";
import { Landing } from "./Landing";
import { Button } from "./ui/button";

const meta = {
  title: "App/Landing",
  component: Landing,
  decorators: [
    (Story) => (
      <div className="flex min-h-dvh flex-col">
        <Story />
        <Footer />
      </div>
    ),
  ],
  args: {
    // In the app this button is wrapped in Clerk's SignInButton.
    signIn: <Button size="lg">Sign in to get started</Button>,
  },
} satisfies Meta<typeof Landing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedOut: Story = {};
