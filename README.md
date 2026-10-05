Welcome to your new TanStack Start app!

# Getting Started

To run this application:

```bash
npm install
npm run dev
```

# Building For Production

To build this application for production:

```bash
npm run build
```

## Styling

Tailwind CSS v4 with shadcn/ui. All UI follows the design system in [`docs/ui.md`](docs/ui.md): semantic tokens only (defined in `src/styles.css`), light and dark mode.

### Storybook

```bash
npm run storybook        # http://localhost:6006
npm run build-storybook  # static build in storybook-static/
```

Storybook uses its own Vite config (`.storybook/vite.config.ts`, React + Tailwind only), so the app's TanStack Start, Cloudflare and devtools plugins never load in it. Switch light/dark from the toolbar theme menu. The **Foundations** page shows the design tokens.

## Linting & Formatting

This project uses [Biome](https://biomejs.dev/) for linting and formatting. The following scripts are available:


```bash
npm run lint
npm run format
npm run check
```

## Database (D1 + Drizzle)

Data lives in Cloudflare D1, bound as `DB` in `wrangler.jsonc` and accessed through Drizzle (`createDb(env.DB)` from `src/db`, with `env` from `cloudflare:workers` in server code). Production binds the remote `todo` database and the `preview` environment binds `todo-preview`; `npm run dev` and the tests only ever use the local copy (stored under `.wrangler/state`).

Schema changes are versioned migrations, never edited by hand once applied, and must be additive (see `docs/adr/0003-separate-preview-worker.md`):

1. Change the Drizzle schema in `src/db/schema.ts`.
2. Generate a migration into `migrations/`: `npm run db:generate`
3. Apply pending migrations to the local database: `npm run db:migrate:local`

`npm run dev` uses the same local database, so apply migrations before starting it. After changing bindings in `wrangler.jsonc`, regenerate `worker-configuration.d.ts` with `npm run cf-typegen`.

## Tests

```bash
npm test            # run once
npm run test:watch  # watch mode
```

Vitest runs tests inside the Workers runtime (`@cloudflare/vitest-pool-workers`, configured in `vitest.config.ts`) against a real local D1. Every test file gets its own fresh database with all migrations applied, and after each test every row is deleted and AUTOINCREMENT counters are reset, so no test sees another's rows or inherits its ids (schema created in a file, e.g. in `beforeAll`, does persist across that file's tests). Seed data in `beforeEach` or the test itself, not `beforeAll`. The Todos module (`src/todos`) is the test seam for product behaviour; see `src/todos/todos.test.ts` for the pattern.

## End-to-end tests

```bash
npx playwright install chromium   # once
npm run e2e                       # against a dev server it starts on :3100
BASE_URL=https://pr-12-todo-preview.personal-d9e.workers.dev npm run e2e
npm run e2e:report                # open the last HTML report
```

Playwright (`playwright.config.ts`, specs in `e2e/`) drives Chromium. Without `BASE_URL` it starts `vite dev` on port 3100 (reusing one already there, outside CI); with `BASE_URL` it tests that deployment and starts nothing.

Environment, read from `.env.local` locally (real environment variables win; `E2E_ENV_FILE` points at another file, e.g. the main checkout's from a git worktree):

- `CLERK_PUBLISHABLE_KEY` (falls back to `VITE_CLERK_PUBLISHABLE_KEY`) and `CLERK_SECRET_KEY`: the Clerk development instance.
- `E2E_CLERK_USER_EMAIL`: the dedicated E2E test user. It must exist in that Clerk instance.

Global setup (`e2e/global.setup.ts`) calls `clerkSetup()` from `@clerk/testing` once for a Testing Token. On failure, the HTML report (`playwright-report/`), traces, and screenshots (`test-results/`) are kept for CI to upload.

### Conventions for feature tests

- Import `test` and `expect` from `e2e/support/fixtures`, not from `@playwright/test`.
- Sign in with `signIn(page)` from `e2e/support/auth` after `page.goto("/")`. It signs in as the E2E user with a Clerk sign-in token (no password, no UI).
- Tests run in parallel as the same user, sometimes against a shared deployment. Never assume an empty account and never depend on another test's data. Name everything a test creates with `testData.uniqueName("Groceries")` and assert on that name. Right after creating it, register how to delete it with `testData.onCleanup(...)`. Cleanup runs after the test, pass or fail, newest first:

  ```ts
  test("an Owner can rename a List", async ({ page, testData }) => {
    await page.goto("/");
    await signIn(page);
    const name = testData.uniqueName("Groceries");
    await createList(page, name); // through the UI
    testData.onCleanup(() => deleteList(page, name));
    // ...
  });
  ```


## Deploy to Cloudflare Workers

This project uses the Cloudflare Vite plugin (configured in `vite.config.ts`) and `wrangler.jsonc`, which has two environments in the "Personal" Cloudflare account (see `docs/adr/0003-separate-preview-worker.md`):

| Environment | Worker | D1 database |
| --- | --- | --- |
| production (top level) | `todo` | `todo` |
| `preview` | `todo-preview` | `todo-preview` |

Clerk keys: `VITE_CLERK_PUBLISHABLE_KEY` must be set when building (Vite reads it from the shell or `.env.local` and inlines it); `CLERK_SECRET_KEY` is a Worker secret, set once per environment (it prompts for the value):

```bash
npx wrangler secret put CLERK_SECRET_KEY --env preview   # todo-preview
npx wrangler secret put CLERK_SECRET_KEY                 # todo (production)
```

### Preview deploys

```bash
npm run preview:deploy -- <alias>   # e.g. pr-42
url=$(npm run -s preview:deploy -- pr-42)
```

`scripts/preview-deploy.ts` builds the app for the `preview` environment (`CLOUDFLARE_ENV=preview vite build`), applies pending migrations to the remote `todo-preview` D1, and uploads a new version of `todo-preview` with `wrangler versions upload --preview-alias <alias>`. The alias URL, `https://<alias>-todo-preview.personal-d9e.workers.dev`, is the only line it prints on stdout (all build and Wrangler output goes to stderr), so CI can capture it. The URL is read from Wrangler's machine-readable output file, not its console log. Aliases must be lowercase letters, digits and dashes, starting with a letter.

`versions upload` only works once the `todo-preview` Worker exists. On a fresh account, create it first, e.g. by running the `wrangler secret put CLERK_SECRET_KEY --env preview` command above and answering yes when it offers to create the Worker.


## Setting up Clerk

1. Create an application in the [Clerk dashboard](https://dashboard.clerk.com).
2. Copy its publishable and secret keys into `.env.local`:

   ```bash
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

3. Start the app and use the Sign in button in the header.

### What's wired up

- `clerkMiddleware()` authenticates each server request from `src/start.ts`.
- `<ClerkProvider>` supplies auth state throughout the app.
- `<SignInButton>` and `<UserButton>` in the header respond to the session.

### Protecting a route

Use `auth()` in a loader or server function when authorization must happen on the
server:

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { auth } from '@clerk/tanstack-react-start/server'

const getAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const { userId } = await auth()
  return { userId }
})

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const { userId } = await getAuth()
    if (!userId) throw redirect({ to: '/' })
  },
})
```

`<Show when="signed-in">` remains useful for presentation, but server-side checks
are the security boundary. See Clerk's [TanStack Start docs](https://clerk.com/docs/tanstack-react-start/getting-started/quickstart).

### Production checklist

- Set both keys in the production environment; never expose `CLERK_SECRET_KEY`.
- Use production keys from a dedicated production Clerk instance.
- Configure the production domain and any social connections in the Clerk dashboard.


## Shadcn

Add components using the latest version of [Shadcn](https://ui.shadcn.com/).

```bash
npx shadcn@latest add button
```

After adding, check that generated files import `cn` from `#/lib/utils` and use only semantic colour tokens (see `docs/ui.md`).


## T3Env

- You can use T3Env to add type safety to your environment variables.
- Add Environment variables to the `src/env.mjs` file.
- Use the environment variables in your code.

### Usage

```ts
import { env } from "#/env";

console.log(env.VITE_APP_TITLE);
```






## Routing

This project uses [TanStack Router](https://tanstack.com/router) with file-based routing. Routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from "@tanstack/react-router";
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you render `{children}` in the `shellComponent`.

Here is an example layout that includes a header:

```tsx
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'My App' },
    ],
  }),
  shellComponent: ({ children }) => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <header>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
          </nav>
        </header>
        {children}
        <Scripts />
      </body>
    </html>
  ),
})
```

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Server Functions

TanStack Start provides server functions that allow you to write server-side code that seamlessly integrates with your client components.

```tsx
import { createServerFn } from '@tanstack/react-start'

const getServerTime = createServerFn({
  method: 'GET',
}).handler(async () => {
  return new Date().toISOString()
})

// Use in a component
function MyComponent() {
  const [time, setTime] = useState('')
  
  useEffect(() => {
    getServerTime().then(setTime)
  }, [])
  
  return <div>Server time: {time}</div>
}
```

## API Routes

You can create API routes by using the `server` property in your route definitions:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/api/hello')({
  server: {
    handlers: {
      GET: () => json({ message: 'Hello, World!' }),
    },
  },
})
```

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/people')({
  loader: async () => {
    const response = await fetch('https://swapi.dev/api/people')
    return response.json()
  },
  component: PeopleComponent,
})

function PeopleComponent() {
  const data = Route.useLoaderData()
  return (
    <ul>
      {data.results.map((person) => (
        <li key={person.name}>{person.name}</li>
      ))}
    </ul>
  )
}
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).


# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).

For TanStack Start specific documentation, visit [TanStack Start](https://tanstack.com/start).
