# Issue tracker: Linear

Specs and tickets for this repo live in Linear, team **Todo-with-skills**. Use the
`linear-todo-with-skills` MCP server for all operations (configured in `.mcp.json`).

**Specs and tickets are different things, stored differently:**

- A **spec** is a Linear **Project**, with the spec text in a project **Document** titled "Spec". The project description just points at that document and at the repo docs (`GLOSSARY.md`, `docs/adr/`, `docs/ui.md`).
- A **ticket** is a Linear **Issue** in that project. Tickets are never sub-issues of anything; their task graph is expressed only through `blockedBy` relations.
- Issues not tied to a spec (bugs, triage) are plain issues with no project.

Example: project `P-TOD-1` "Personal Lists and Todos (v1)" → document "Spec" → issues TOD-6 … TOD-17.

## Specs (Projects)

- **Publish a spec** (`/to-spec`): `save_project` with `name`, `addTeams: ["Todo-with-skills"]`, `lead: "me"`, `state: "planned"`, a one-line `summary`; then `save_document` with `project: <project>`, `title: "Spec"`, and the spec as `content`. Triage labels don't apply to projects.
- **Fetch a spec**: `get_project` with its identifier (e.g. `P-TOD-1`), then read its "Spec" document with `get_document`; list its tickets with `list_issues` filtered by `project`.
- **Update a spec**: `save_document` with `id` and `patch` (prefer patches over resending the whole text).
- **Spec work started / finished**: `save_project` with `state: "started"` when the first ticket is claimed; `state: "completed"` when every ticket is Done or Canceled. "Close the spec" means this.
- **Comment on a spec**: `save_comment` with `documentId` (the Spec document) or `projectId`.

## Tickets (Issues)

- **Create an issue**: `save_issue` with `team: "Todo-with-skills"`, `title`, Markdown `description`, `state: "Backlog"`. For a spec's ticket (`/to-tickets`) also pass `project: <spec project>`, start the description with a `## Spec` section linking the Spec document, and set `blockedBy` to its blockers.
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

## Closing work: through pull requests

**This tracker closes work through PRs: yes.** Every spec lands as **one pull request** from its integration branch into `main` (`/implement-spec` opens it as a draft after the first merge and marks it ready at the end). Ticket branches are internal and never get their own PR.

- PR title: the spec's project name. PR body (written with `/pr`): link the Spec document and list every ticket identifier (e.g. `Fixes TOD-6`, `Fixes TOD-7`) so Linear's GitHub integration moves them to Done on merge.
- A human reviews the PR (and its preview, once the Delivery pipeline exists) and merges it. Agents never merge to `main`.
- After merge, set the spec's Project to `completed` if every ticket is Done or Canceled.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

## When a skill says "publish to the issue tracker"

- Publishing a **spec** → create a Project + "Spec" document (see Specs).
- Publishing **tickets** → create Issues in that Project (see Tickets).
- Anything else (a bug, a triage item) → a plain Issue with no project.

## When a skill says "fetch the relevant ticket"

`get_issue` with its identifier, then `list_comments`. If the skill means the spec (e.g. `/implement-spec P-TOD-1`), fetch the Project and its Spec document instead.

## When a skill says "the spec and its tickets"

The Spec document of the Project, plus every Issue in that Project. Skip issues labelled `ready-for-human`: they are for a person, not an agent.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single parent issue with **child** issues as tickets.

- **Map**: a Linear issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body.
- **Child ticket**: a sub-issue of the map (`save_issue` with `parentId: <map>`). Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`).
- **Blocking**: Linear's native relations — `save_issue` with `blockedBy: [...]`. A ticket is unblocked when every blocker is Done or Canceled.
- **Frontier query**: list the map's open children, drop any with an open blocker or an assignee; first in map order wins.
- **Claim**: `save_issue` with `assignee: "me"`, `state: "In Progress"` — the session's first write.
- **Resolve**: comment the answer, set `state: "Done"`, then append a context pointer (gist + link) to the map's Decisions-so-far.
