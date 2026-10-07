# Each preview gets its own D1 database

Each pull request preview runs against its own D1 database, `todo-preview-<alias>` (alias `pr-42` gives `todo-preview-pr-42`), instead of the one shared `todo-preview` database. With a shared database, two open PRs read and wrote the same rows, and a PR's migration changed the schema under every other open PR's preview. `preview:deploy` looks the database up by name and creates it on a PR's first deploy, applies pending migrations to it, and uploads the version with its `DB` binding pointing at it (each version uploaded with `versions upload` carries its own bindings). Later pushes reuse the database and its data and apply only new migrations. The `preview` environment's `DB` binding in `wrangler.jsonc` stays only as the build template. This partly supersedes ADR-0003's Consequences: previews no longer share a database.

## Consequences

The account is on Workers Free, which allows 10 D1 databases. With `todo` (and, until it is deleted, the old `todo-preview`) that leaves room for 8 or 9 open previews, so a PR's database must be deleted when the PR closes, and deploys clean up the databases of PRs that are not open. That cleanup accepts a narrow race: it can delete the database of a PR reopened moments after it listed the open PRs; that PR's next deploy recreates the database, empty.

Migrations must still be additive (no dropping or renaming columns): production applies migrations before it deploys, so the old production code runs against the new schema for a moment.

Cloudflare recommends Workers Previews (`wrangler preview`) for testing PRs, but it is still in open beta and does not provision a D1 database per preview either. Revisit at GA.

Any future stateful binding (KV, R2, Durable Objects, ...) must be isolated per PR the same way, or its ADR must state why sharing it across previews is safe.
