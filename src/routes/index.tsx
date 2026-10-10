import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "#/components/AppShell";
import { LandingPage, loadIfSignedIn } from "#/components/LandingPage";
import { ListsSidebar } from "#/components/ListsSidebar";
import { MainHeader } from "#/components/MainHeader";
import { NoLists } from "#/components/NoLists";
import { listsQueryOptions, useCreateListFromName } from "#/todos/queries";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    loadIfSignedIn(async () => {
      const [first] = await context.queryClient.ensureQueryData(
        listsQueryOptions(),
      );
      if (first) {
        throw redirect({ to: "/lists/$listId", params: { listId: first.id } });
      }
    }),
  component: Home,
});

function Home() {
  const { signedIn } = Route.useLoaderData();
  if (!signedIn) return <LandingPage />;

  return (
    <AppShell sidebar={<ListsSidebar />} header={<MainHeader title="Todo" />}>
      <CreateFirstList />
    </AppShell>
  );
}

function CreateFirstList() {
  const createList = useCreateListFromName();

  return (
    <NoLists
      error={createList.error}
      onNameChange={createList.clearError}
      onCreate={(name) => {
        if (!createList.isPending) createList.create(name);
      }}
    />
  );
}
