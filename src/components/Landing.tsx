import {
  CalendarClockIcon,
  GripVerticalIcon,
  ListChecksIcon,
} from "lucide-react";
import type { ReactNode } from "react";

const FEATURES = [
  {
    icon: ListChecksIcon,
    title: "Lists for everything",
    text: "Keep groceries, work and weekend plans apart in their own Lists.",
  },
  {
    icon: CalendarClockIcon,
    title: "Due dates that nag",
    text: "Give a Todo a Due date and see at a glance when it is Overdue.",
  },
  {
    icon: GripVerticalIcon,
    title: "Your order",
    text: "Drag Todos and Lists into the order that makes sense to you.",
  },
];

/**
 * Signed-out home page: a short introduction and the sign-in call to action.
 * `signIn` is the sign-in control (a Clerk SignInButton in the app).
 */
export function Landing({ signIn }: { signIn: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16 md:py-24">
      <section className="flex flex-col items-start gap-5">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          A calm place for your Todos.
        </h1>
        <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
          Todo is a personal task manager. Sign in to keep your own Lists of
          things to do, with optional Due dates, in the order you choose.
        </p>
        {signIn}
      </section>

      <ul className="mt-14 grid gap-4 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <li
            key={title}
            className="flex flex-col gap-2 rounded-xl border bg-card p-4 text-card-foreground shadow-sm"
          >
            <Icon className="size-4 text-muted-foreground" aria-hidden />
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="text-xs text-muted-foreground">{text}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
