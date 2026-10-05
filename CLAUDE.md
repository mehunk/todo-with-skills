## Agent skills

### Issue tracker

Linear (team Todo-with-skills), via the `linear-todo-with-skills` MCP server: a spec is a Project with a "Spec" document, its tickets are Issues in that Project linked by `blockedBy`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## UI

All UI work follows the design system in `docs/ui.md` (semantic shadcn tokens only, scarce use of `primary`, light + dark, Storybook stories for every presentational component state).
