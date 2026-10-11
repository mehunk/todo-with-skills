/**
 * The main card header title when no List is selected (the "No Lists" empty
 * state). A selected List uses ListHeader.
 */
export function MainHeader({ title }: { title: string }) {
  return (
    <h1 className="min-w-0 flex-1 truncate text-base font-semibold">{title}</h1>
  );
}
