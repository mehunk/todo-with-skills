# Clerk development instance in production

There is no custom domain: production runs on Cloudflare's `*.workers.dev` URL, and Clerk production instances require a domain we own. So production uses a Clerk **development** instance, with its limits accepted for this demo project: at most 100 users, a "Development mode" badge, a dev-browser handshake, and shared OAuth credentials.

## Consequences

Moving to a production instance later needs a custom domain first, and dev-instance users do not carry over, so every Owner's `owner_id` (ADR-0001) would need migrating to the new instance's user ids.
