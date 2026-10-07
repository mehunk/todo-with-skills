# Previews run on a separate Worker, not Worker Previews

> Partly superseded by ADR-0004: each preview now gets its own D1 database, so previews no longer share one. The additive-migrations rule stands, for the reason ADR-0004 gives.

Each pull request is deployed to a separate `todo-preview` Worker (a Wrangler `preview` environment) with `wrangler versions upload --preview-alias pr-<N>`, bound to one shared preview D1 database. We considered Cloudflare Worker Previews (`wrangler preview`), but in October 2026 it was in open beta with bugs affecting this app (broken `--json` output for Workers with static assets, secrets dropped on redeploy), and running previews on the production Worker would let the CI token used by pull requests overwrite production. A separate Worker keeps production out of reach of preview CI.

## Consequences

Previews share one D1 database, so migrations must be additive (no dropping or renaming columns) and E2E tests create and delete their own uniquely named data. Preview and production CI share one account-scoped Cloudflare API token, an accepted trade-off: the separate Worker protects production from accidental overwrites by the preview workflow, not from a hostile PR, since preview CI could technically deploy production. Revisit Worker Previews once it is generally available.
