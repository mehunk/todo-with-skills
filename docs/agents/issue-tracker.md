# Issue tracker: GitHub

Specs and tickets for this repo live as GitHub issues in `mehunk/todo-with-skills`. Use the `gh` CLI for all operations; it infers the repo from `git remote -v` when run inside a clone. Specs and tickets up to now (projects `P-TOD-*`, issues `TOD-*`) are in the former Linear team **Todo-with-skills**, kept read-only.

**Specs and tickets are both issues, told apart by structure:**

- A **spec** is an issue labelled `spec`, with the spec text as its body. Its body ends with a pointer to the repo docs (`GLOSSARY.md`, `docs/adr/`, `docs/ui.md`).
- A **ticket** is a **sub-issue** of its spec. Its task graph is expressed through GitHub's native **issue dependencies** (`blocked by`), never through nesting tickets under each other.
- Issues not tied to a spec (bugs, triage) are plain issues with no parent and no `spec` label.

Several specs may share one larger design: then one spec's body is the **shared spec** (holding the common implementation and testing decisions), and the other specs list their own user stories and link to it (`#<n>`).

## Spec size

A spec lands as one pull request, so its size is the size of the review. Keep each spec to:

- a PR a human can review in 30–60 minutes (code, preview, clicking through the feature);
- 2–4 agent tickets (`ready-for-agent`); `ready-for-human` tickets don't count;
- one outcome that can be demonstrated on its own once merged.

When a plan is bigger, split it into several specs in dependency order (each its own `spec` issue), rather than one large spec. Generated files, lockfiles and pure reformat commits don't count toward the review size.

## Specs

- **Publish a spec** (`/to-spec`): `gh issue create --label spec --title "<spec name>" --body-file <file>` (or a heredoc). Triage labels don't apply to specs.
- **Fetch a spec**: `gh issue view <n> --json number,title,body,labels,comments`; list its tickets with `gh api repos/{owner}/{repo}/issues/<n>/sub_issues --jq '.[] | {number, title, state, labels: [.labels[].name]}'`.
- **Update a spec**: `gh issue edit <n> --body-file <file>` with the whole new body; say what changed in a comment (`gh issue comment`), so the history is readable.
- **Spec work started / finished**: assign the spec (`gh issue edit <n> --add-assignee @me`) when the first ticket is claimed. It closes with its pull request (below); if every ticket is closed some other way, close it with `gh issue close <n> --comment "..."`. "Close the spec" means this.
- **Comment on a spec**: `gh issue comment <n> --body "..."`.

## Tickets

- **Create a ticket** (`/to-tickets`): `gh issue create --parent <spec> --label ready-for-agent --title "..." --body-file <file>` (`ready-for-human` for a person's ticket). Start the body with a `## Spec` section linking the spec (`#<spec>`).
- **Add a blocker**: `gh api --method POST repos/{owner}/{repo}/issues/<ticket>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric database id (`gh api repos/{owner}/{repo}/issues/<n> --jq .id`), not its `#number` or `node_id`.
- **Is it blocked?** List its open blockers: `gh api repos/{owner}/{repo}/issues/<n>/dependencies/blocked_by --jq '[.[] | select(.state == "open") | .number]'`. Do not rely on `issue_dependencies_summary`: it is updated with a delay. A ticket is unblocked when every blocker is closed.
- **Read an issue**: `gh issue view <n> --json number,title,body,labels,assignees,comments`.
- **List issues**: `gh issue list --state open --json number,title,labels,assignees` with `--label` filters.
- **Claim**: `gh issue edit <n> --add-assignee @me`.
- **Comment on an issue**: `gh issue comment <n> --body "..."`.
- **Apply / remove labels**: `gh issue edit <n> --add-label "..."` / `--remove-label "..."`.
- **Close**: `gh issue close <n> --comment "<outcome>"`. For won't-do, `gh issue close <n> --reason "not planned" --comment "..."` and the `wontfix` label.

Refer to issues as `#<n>`. GitHub shares one number space across issues and pull requests, so a bare `#42` may be either: resolve with `gh issue view 42` and fall back to `gh pr view 42`.

## Status

| State | Meaning |
| --- | --- |
| open, no assignee | Not started; `ready-for-agent` / `ready-for-human` say who can take it |
| open, assigned | Claimed; whoever is assigned is working on it |
| closed (completed) | Done |
| closed (not planned) | Will not be actioned |

## Closing work: through pull requests

**This tracker closes work through PRs: yes.** Every spec lands as **one pull request** from its integration branch into `main` (`/implement-spec` opens it as a draft after the first merge and marks it ready at the end). Ticket branches are internal and never get their own PR.

- PR title: the spec's title. PR body (written with `/pr`): `Closes #<spec>` and a `Closes #<n>` line for every agent ticket, so merging closes them. Leave `ready-for-human` tickets open: a person closes them when their step is done.
- A human reviews the PR (and its preview) and merges it. Agents never merge to `main`.
- `main` is protected by the "Protect main" ruleset: changes land only through a pull request whose `Checks` and `PR pipeline` checks are green and whose branch is up to date with `main`. Direct pushes, force pushes and deleting `main` are blocked. Repo admins can bypass in an emergency.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

## When a skill says "publish to the issue tracker"

- Publishing a **spec** → an issue labelled `spec` (see Specs).
- Publishing **tickets** → sub-issues of that spec, with their blockers (see Tickets).
- Anything else (a bug, a triage item) → a plain issue.

## When a skill says "fetch the relevant ticket"

Read it as in **Read an issue**. If the skill means the spec (e.g. `/implement-spec <n>`), fetch the spec and its sub-issues instead.

## When a skill says "the spec and its tickets"

The spec issue's body, plus every sub-issue of it. Skip sub-issues labelled `ready-for-human`: they are for a person, not an agent.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single parent issue with **child** issues as tickets.

- **Map**: an issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body.
- **Child ticket**: a sub-issue of the map (`gh issue create --parent <map>`). Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`).
- **Blocking**: native issue dependencies, as in **Add a blocker**. A ticket is unblocked when every blocker is closed.
- **Frontier query**: list the map's open sub-issues, drop any with an open blocker or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me` — the session's first write.
- **Resolve**: comment the answer, close the issue, then append a context pointer (gist + link) to the map's Decisions-so-far.
