# Clerk user ID is the Owner identity; no users table

Every List and Todo stores the Owner as the Clerk `userId` string directly, and the app keeps no users table of its own. We store no profile data, so a local users table would only add a Clerk-to-database sync (webhooks, consistency on deletion) with nothing to show for it.

## Consequences

Switching auth providers later means migrating every `owner_id` to the new provider's identifiers. Data belonging to a user deleted in Clerk is orphaned rather than removed, since nothing listens for Clerk user deletion.
