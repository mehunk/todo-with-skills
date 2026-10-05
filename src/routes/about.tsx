import { createFileRoute } from "@tanstack/react-router";
import Footer from "#/components/Footer";

export const Route = createFileRoute("/about")({
	component: About,
});

function About() {
	return (
		<>
			<main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
				<h1 className="mb-4 text-3xl font-bold tracking-tight">About Todo</h1>
				<div className="flex max-w-2xl flex-col gap-3 text-sm text-muted-foreground">
					<p>
						Todo is a personal task manager. Each signed-in person keeps their
						own Lists of Todos; nobody else can see them.
					</p>
					<p>
						A Todo has a title, an optional Due date and can be marked
						Completed. Todos whose Due date has passed are shown as Overdue.
					</p>
				</div>
			</main>
			<Footer />
		</>
	);
}
