# UI design system

Every UI change follows this document. Vocabulary follows `GLOSSARY.md`.

The look was chosen from a throwaway prototype (variant C, "inset cards + table rows"); the prototype lives on branch `prototype/ui-v1` for reference only. Do not copy its code: it has no tests, no accessibility work, and hand-rolled controls that shadcn/ui replaces.

## Rules

1. **Semantic tokens only.** Components use shadcn's semantic Tailwind colours (`bg-background`, `text-muted-foreground`, `bg-primary`, `border`, `text-destructive`, …). No hex, `rgb()`, `oklch()` or Tailwind palette colours (`zinc-500`, `teal-600`) in components. If a colour is missing, add a token; don't inline one.
2. **One token set.** The shadcn variables in the global stylesheet are the only colour system. The scaffold's ocean-themed variables (`--sea-ink`, `--lagoon`, `--palm`, …), its gradient body background and the Fraunces font are removed.
3. **Primary is scarce.** `primary` is used only for: the selected List in the sidebar, checked checkboxes, and the main call-to-action button on a surface. Everything else is neutral.
4. **Both themes.** Every component must look right in light and dark mode. Because rule 1 holds, this is free; check it anyway in Storybook.
5. **shadcn/ui first.** Use shadcn components (new-york style, lucide icons) before writing your own. Add missing ones with the shadcn CLI.

## Tokens

Base: shadcn `zinc`. Overrides:

| Token | Light | Dark |
| --- | --- | --- |
| `--primary` | `oklch(0.58 0.1 200)` | `oklch(0.8 0.11 185)` |
| `--primary-foreground` | `oklch(0.99 0 0)` | `oklch(0.2 0.03 200)` |
| `--ring` | same as `--primary` | same as `--primary` |
| `--accent` | `oklch(0.96 0.02 195)` | `oklch(0.28 0.04 200)` |
| `--accent-foreground` | `oklch(0.35 0.07 200)` | `oklch(0.9 0.06 185)` |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` |

- **Font**: Manrope (`font-sans`) everywhere. Numbers that line up (counts, dates) use `tabular-nums`.
- **Type scale**: List title `text-base font-semibold`; Todo title `text-sm`; secondary text (counts, Due dates, section labels) `text-xs text-muted-foreground`.
- **Radius**: `--radius: 0.625rem`. Cards `rounded-xl`; sidebar items `rounded-lg`; inputs and buttons `rounded-md`; checkboxes `rounded-[4px]`.
- **Spacing**: page padding `p-3` (mobile) / `p-5` (≥ md); gap between sidebar and main card `gap-5`; card inner horizontal padding `px-4`.
- **Icons**: lucide, `size-4` in rows and buttons, `size-5` for the mobile menu button, `size-8`–`size-10` in empty states.

## Layout

- **Canvas**: `bg-muted/50` page background. Two floating cards on it: the **sidebar card** (`w-64`) and the **main card** (fills the rest, max content width `max-w-6xl`). Both: `rounded-xl border bg-card shadow-sm`.
- **Sidebar card**: header row "My Lists" + a `+` icon button. Below, one row per List (`h-9`): drag handle, name (truncated), and a small red dot when the List contains any Overdue Todo. The selected List is `bg-primary text-primary-foreground`; others `hover:bg-muted`.
- **New List**: clicking `+` shows an input at the bottom of the sidebar; Enter creates, Esc cancels, validation errors appear under the input.
- **Main card header**: List name (click to rename in place), "N open" count, and a `⋯` dropdown menu with Rename, Clear Completed, and Delete List (destructive, opens a confirmation dialog).
- **Todo table**: rows on a grid — drag handle · checkbox · title · Due date (fixed `5.5rem`, right-aligned) · actions. **No column-header row.** Rows are separated by `border-b`.
- **Add row**: the last row of the not-Completed Todos is an inline "Add Todo" input with a `+` icon; borderless until focused.
- **Completed section**: below the table, a "Completed (N)" toggle, **expanded by default**, with "Clear Completed" beside it. Completed rows are `text-muted-foreground line-through` and have no drag handle.

## Todo row states

Each state must have a Storybook story.

| State | Appearance |
| --- | --- |
| Not Completed | checkbox empty, title `text-sm` |
| Completed | checkbox filled `primary`, title muted + strikethrough, no drag handle |
| With Due date | Due date in `text-xs text-muted-foreground`: "Today", "Tomorrow", "Yesterday", otherwise a short date |
| Overdue | Due date `text-destructive font-medium` (never on Completed Todos) |
| No Due date | empty Due date cell (a faint "—" on ≥ sm) |
| Editing | title becomes an input with a focus ring; Enter saves, Esc cancels |
| Hover | `bg-muted/50`; drag handle and delete action fade in |
| Dragging | lifted row with `shadow-md`, placeholder keeps its height |

## Density and sizing

- Compact: Todo and List rows are at least `h-10` / `h-9` on desktop.
- On touch / below `sm`, interactive rows are at least `44px` tall (`min-h-11`) and row actions are always visible (no hover-only affordances).

## Mobile (below `md`)

- The sidebar card becomes a slide-in drawer from the left (shadcn `Sheet`), opened by a menu button in the main card header. Selecting a List closes it.
- The Todo grid collapses to checkbox · title · Due date; delete moves into a per-row `⋯` menu, and dragging uses dnd-kit's touch sensor on the whole row (press-and-hold).

## Empty states

- **No Lists**: centred in the main card — icon, "Create your first List", one line of help, and the List name input.
- **Empty List**: centred icon and "Nothing here yet. Add your first Todo." under the Add row.

## Feedback

- Optimistic changes that fail roll back and show a sonner toast ("Couldn't save — try again").
- Validation errors appear directly under the input that caused them, in `text-xs text-destructive`.

## Storybook

- A **Foundations** page shows the tokens above (colours in both themes, type scale, radius, spacing, icon sizes).
- Every presentational component has stories covering each of its states (see the Todo row table). Data-fetching and page components have no stories.
