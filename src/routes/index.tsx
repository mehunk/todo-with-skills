import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "#/components/AppShell";
import { LandingPage } from "#/components/LandingPage";
import { ListsSidebar } from "#/components/ListsSidebar";
import { MainHeader } from "#/components/MainHeader";
import { NoLists } from "#/components/NoLists";
import { fetchOwnerId } from "#/todos/functions";
import { listsQueryOptions, useCreateList } from "#/todos/queries";
import { listNameSchema } from "#/todos/schemas";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const ownerId = await fetchOwnerId();
    if (!ownerId) return { signedIn: false };
    const [first] = await context.queryClient.ensureQueryData(
      listsQueryOptions(),
    );
    if (first) {
      throw redirect({ to: "/lists/$listId", params: { listId: first.id } });
    }
    return { signedIn: true };
  },
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
  const navigate = useNavigate();
  const createList = useCreateList();
  const [error, setError] = useState<string>();

  return (
    <NoLists
      error={error}
      onNameChange={() => setError(undefined)}
      onCreate={(name) => {
        const parsed = listNameSchema.safeParse(name);
        if (!parsed.success) {
          setError(parsed.error.issues[0].message);
          return;
        }
        if (createList.isPending) return;
        createList.mutate(
          { name: parsed.data },
          {
            onSuccess: (list) =>
              navigate({ to: "/lists/$listId", params: { listId: list.id } }),
          },
        );
      }}
    />
  );
}
