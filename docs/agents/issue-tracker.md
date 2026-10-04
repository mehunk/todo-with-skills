# Issue tracker: Linear

Issues and specs for this repo live in Linear, team **Todo-with-skills**. Use the
`linear-todo-with-skills` MCP server for all operations (configured in `.mcp.json`).
Issues are not attached to a project unless the user asks.

## Conventions

- **Create an issue**: `save_issue` with `team: "Todo-with-skills"`, `title`, Markdown `description`, `state: "Backlog"`.
- **Read an issue**: `get_issue` with its identifier (e.g. `TOD-12`), plus `list_comments` for discussion.
- **List issues**: `list_issues` filtered by team, `state` and/or `label`.
- **Comment on an issue**: `save_comment`.
- **Apply / remove labels**: `save_issue` with `id` and `addLabels` / `removeLabels` (never `labels`, which replaces the whole set).
- **Close**: comment with the outcome, then `save_issue` with `state: "Done"`. For won't-do, use `state: "Canceled"`.

Refer to issues by their Linear identifier (`<TEAM>-<n>`).

## Status flow

| Status      | Meaning                                         |
| ----------- | ----------------------------------------------- |
| Backlog     | Newly created; not yet ready to work on         |
| Todo        | Ready to be picked up                           |
| In Progress | Claimed; assigned to whoever is working on it   |
| Done        | Completed                                       |
| Canceled    | Will not be actioned                            |

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

## When a skill says "publish to the issue tracker"

Create a Linear issue in team Todo-with-skills (see Conventions).

## When a skill says "fetch the relevant ticket"

`get_issue` with its identifier, then `list_comments`.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single parent issue with **child** issues as tickets.

- **Map**: a Linear issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body.
- **Child ticket**: a sub-issue of the map (`save_issue` with `parentId: <map>`). Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`).
- **Blocking**: Linear's native relations — `save_issue` with `blockedBy: [...]`. A ticket is unblocked when every blocker is Done or Canceled.
- **Frontier query**: list the map's open children, drop any with an open blocker or an assignee; first in map order wins.
- **Claim**: `save_issue` with `assignee: "me"`, `state: "In Progress"` — the session's first write.
- **Resolve**: comment the answer, set `state: "Done"`, then append a context pointer (gist + link) to the map's Decisions-so-far.
