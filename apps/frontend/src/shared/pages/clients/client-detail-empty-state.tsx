export function ClientDetailEmptyState({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<div className="animate-rise grid min-h-32 place-items-center rounded-lg border-2 border-dashed border-border/70 p-5 text-center">
			<div>
				<div className="mx-auto grid size-9 place-items-center text-muted-foreground [&_svg]:size-6">
					{icon}
				</div>

				<p className="mt-2 text-sm font-semibold">{title}</p>

				<p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
					{description}
				</p>
			</div>
		</div>
	);
}
