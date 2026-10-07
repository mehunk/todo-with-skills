import { AppVersion } from "./AppVersion";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-6 text-xs text-muted-foreground">
        <p>&copy; {year} Todo</p>
        <p>A personal task manager</p>
        <AppVersion />
      </div>
    </footer>
  );
}
