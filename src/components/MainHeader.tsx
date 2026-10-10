/**
 * The main card header title: the selected List's name, or the app name when
 * no List is selected.
 */
export function MainHeader({ title }: { title: string }) {
  return (
    <h1 className="min-w-0 flex-1 truncate text-base font-semibold">{title}</h1>
  );
}
