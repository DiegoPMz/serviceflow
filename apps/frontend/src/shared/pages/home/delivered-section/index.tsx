import { CalendarClock, CheckCircle2 } from "lucide-react";
import { IconContainer } from "@/shared/components/icon-container";
import { DeliveredSectionSkeleton } from "./delivered-section-skeleton";

export function DeliveredSection() {
	const isLoading = false;

	if (isLoading) {
		return <DeliveredSectionSkeleton />;
	}

	return (
		<section
			aria-labelledby="delivered-heading"
			className="animate-rise rounded-xl border border-border/70 bg-card p-4 sm:p-5"
		>
			{/* Summary */}
			<div className="flex min-w-0 items-center gap-2">
				<span className="shrink-0 text-4xl font-semibold leading-none tracking-tight tabular-nums">
					12
				</span>

				<div className="flex min-w-0 items-center gap-2.5">
					<div className="grid shrink-0 place-items-center rounded-xl bg-success/10 text-success">
						<CheckCircle2 className="size-8" />
					</div>

					<div className="min-w-0">
						<h2
							id="delivered-heading"
							className="text-sm font-semibold leading-snug tracking-tight"
						>
							Órdenes entregadas
						</h2>

						<p className="mt-1 text-xs text-muted-foreground">Esta semana</p>
					</div>
				</div>
			</div>

			{/* Latest delivery */}
			<div className="mt-4 flex min-w-0 items-center gap-3 border-t border-border/70 pt-3">
				<IconContainer icon={CalendarClock} />

				<div className="min-w-0 flex-1">
					<p className="text-[11px] text-muted-foreground">Última entrega</p>

					<p className="mt-1 truncate text-xs font-medium tabular-nums">
						OS-1038
						<span className="font-normal text-muted-foreground">
							{" "}
							· hace 24 min
						</span>
					</p>
				</div>
			</div>
		</section>
	);
}
