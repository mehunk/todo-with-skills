export default function Footer() {
	const year = new Date().getFullYear();

	return (
		<footer className="border-t">
			<div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-6 text-xs text-muted-foreground">
				<p>&copy; {year} Todo</p>
				<p>A personal task manager</p>
			</div>
		</footer>
	);
}
