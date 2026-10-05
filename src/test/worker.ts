// Test-only Worker entry. wrangler.jsonc's `main` is TanStack Start's virtual
// server entry, which only exists inside the app's Vite build, so tests run
// against this stub instead and exercise modules directly.
export default {
	fetch: () => new Response("Not found", { status: 404 }),
} satisfies ExportedHandler;
