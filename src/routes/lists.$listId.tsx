import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { AppShell } from "#/components/AppShell";
import { LandingPage, loadIfSignedIn } from "#/components/LandingPage";
import { ListHeader } from "#/components/ListHeader";
import { ListsSidebar } from "#/components/ListsSidebar";
import { ListTodos } from "#/components/ListTodos";
import { listQueryOptions, listsQueryOptions } from "#/todos/queries";

export const Route = createFileRoute("/lists/$listId")({
  loader: ({ context, params }) =>
    loadIfSignedIn(async () => {
      const [list] = await Promise.all([
        context.queryClient.ensureQueryData(listQueryOptions(params.listId)),
        context.queryClient.ensureQueryData(listsQueryOptions()),
      ]);
      // Unknown and other Owners' Lists look the same: the 404 page.
      if (!list) throw notFound();
    }),
  component: ListPage,
});

function ListPage() {
  const { signedIn } = Route.useLoaderData();
  const { listId } = Route.useParams();
  if (!signedIn) return <LandingPage />;

  return (
    <AppShell
      sidebar={<ListsSidebar selectedListId={listId} />}
      header={<SelectedListHeader />}
    >
      <ListTodos key={listId} listId={listId} />
    </AppShell>
  );
}

function SelectedListHeader() {
  const { listId } = Route.useParams();
  const { data: list } = useSuspenseQuery(listQueryOptions(listId));
  return (
    <ListHeader name={list?.name ?? ""} openCount={list?.openCount ?? 0} />
  );
}
