import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { AppShell } from "#/components/AppShell";
import { LandingPage } from "#/components/LandingPage";
import { MainHeader } from "#/components/MainHeader";
import { PlaceholderSidebar } from "#/components/ShellPlaceholder";
import { fetchOwnerId } from "#/todos/functions";
import { listQueryOptions } from "#/todos/queries";

export const Route = createFileRoute("/lists/$listId")({
  loader: async ({ context, params }) => {
    const ownerId = await fetchOwnerId();
    if (!ownerId) return { signedIn: false };
    const list = await context.queryClient.ensureQueryData(
      listQueryOptions(params.listId),
    );
    // Unknown and other Owners' Lists look the same: the 404 page.
    if (!list) throw notFound();
    return { signedIn: true };
  },
  component: ListPage,
});

function ListPage() {
  const { signedIn } = Route.useLoaderData();
  if (!signedIn) return <LandingPage />;

  return (
    <AppShell sidebar={<PlaceholderSidebar />} header={<SelectedListName />}>
      <div className="flex-1" />
    </AppShell>
  );
}

function SelectedListName() {
  const { listId } = Route.useParams();
  const { data: list } = useSuspenseQuery(listQueryOptions(listId));
  return <MainHeader title={list?.name ?? ""} />;
}
