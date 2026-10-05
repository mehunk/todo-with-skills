import type { Meta, StoryObj } from "@storybook/react-vite";
import { ListTodoIcon, MenuIcon, PlusIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

/** The design tokens from docs/ui.md, rendered with the real stylesheet. */
const meta = {
  title: "Foundations",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Class names are written out in full so Tailwind generates them.
const COLOURS: { name: string; swatch: string; text?: string }[] = [
  { name: "background", swatch: "bg-background" },
  { name: "foreground", swatch: "bg-foreground" },
  { name: "card", swatch: "bg-card" },
  { name: "popover", swatch: "bg-popover" },
  {
    name: "primary",
    swatch: "bg-primary",
    text: "text-primary-foreground",
  },
  {
    name: "secondary",
    swatch: "bg-secondary",
    text: "text-secondary-foreground",
  },
  { name: "muted", swatch: "bg-muted", text: "text-muted-foreground" },
  { name: "accent", swatch: "bg-accent", text: "text-accent-foreground" },
  {
    name: "destructive",
    swatch: "bg-destructive",
    text: "text-destructive-foreground",
  },
  { name: "border", swatch: "bg-border" },
  { name: "input", swatch: "bg-input" },
  { name: "ring", swatch: "bg-ring" },
  { name: "overlay", swatch: "bg-overlay" },
];

const ICON_SIZES = [
  { icon: PlusIcon, size: "size-4", use: "Rows and buttons" },
  { icon: MenuIcon, size: "size-5", use: "Mobile menu button" },
  { icon: ListTodoIcon, size: "size-8", use: "Empty states (min)" },
  { icon: ListTodoIcon, size: "size-10", use: "Empty states (max)" },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Palette({ theme }: { theme: "light" | "dark" }) {
  return (
    <div
      className={cn(
        theme,
        "flex flex-1 flex-col gap-3 rounded-xl border bg-background p-4 text-foreground",
      )}
    >
      <p className="text-sm font-semibold capitalize">{theme}</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {COLOURS.map(({ name, swatch, text }) => (
          <li key={name} className="flex flex-col gap-1.5">
            <div
              className={cn(
                "flex h-12 items-center justify-center rounded-md border text-xs font-medium",
                swatch,
                text,
              )}
            >
              {text ? "Aa" : null}
            </div>
            <span className="text-xs text-muted-foreground">{name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Foundations() {
  return (
    <div className="flex min-h-dvh flex-col gap-10 bg-background p-5 text-foreground">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Foundations</h1>
        <p className="text-sm text-muted-foreground">
          Tokens from docs/ui.md. Colours show both themes; everything else
          follows the toolbar theme.
        </p>
      </header>

      <Section title="Colours">
        <div className="flex flex-col gap-4 md:flex-row">
          <Palette theme="light" />
          <Palette theme="dark" />
        </div>
      </Section>

      <Section title="Type scale (Manrope)">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-base font-semibold">Groceries</p>
            <p className="text-xs text-muted-foreground">
              List title: text-base font-semibold
            </p>
          </div>
          <div>
            <p className="text-sm">Buy oat milk</p>
            <p className="text-xs text-muted-foreground">Todo title: text-sm</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground tabular-nums">
              3 open · Tomorrow · 12 Oct
            </p>
            <p className="text-xs text-muted-foreground">
              Secondary text: text-xs text-muted-foreground (tabular-nums for
              numbers)
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-destructive">Yesterday</p>
            <p className="text-xs text-muted-foreground">
              Overdue Due date: text-xs font-medium text-destructive
            </p>
          </div>
        </div>
      </Section>

      <Section title="Radius (--radius: 0.625rem)">
        <div className="flex flex-wrap gap-6">
          {[
            ["rounded-xl", "Cards", "rounded-xl"],
            ["rounded-lg", "Sidebar items", "rounded-lg"],
            ["rounded-md", "Inputs, buttons", "rounded-md"],
            ["rounded-[4px]", "Checkboxes", "rounded-[4px]"],
          ].map(([label, use, cls]) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className={cn("size-16 border bg-muted", cls)} />
              <span className="text-xs font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{use}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Spacing">
        <ul className="flex flex-col gap-3 text-xs">
          {[
            ["p-3", "Page padding (mobile)", "w-3"],
            ["px-4", "Card inner horizontal padding", "w-4"],
            ["p-5 / gap-5", "Page padding (≥ md), sidebar–main gap", "w-5"],
            ["w-64", "Sidebar card width", "w-64"],
          ].map(([label, use, width]) => (
            <li key={label} className="flex items-center gap-3">
              <span
                className={cn(
                  "h-4 shrink-0 rounded-sm bg-muted-foreground/40",
                  width,
                )}
              />
              <span className="font-medium">{label}</span>
              <span className="text-muted-foreground">{use}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Icon sizes (lucide)">
        <div className="flex flex-wrap items-end gap-8">
          {ICON_SIZES.map(({ icon: Icon, size, use }) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <Icon className={cn(size, "text-muted-foreground")} />
              <span className="text-xs font-medium">{size}</span>
              <span className="text-xs text-muted-foreground">{use}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

export const Tokens: Story = {
  render: () => <Foundations />,
};
