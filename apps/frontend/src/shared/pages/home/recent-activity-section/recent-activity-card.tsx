import { Clock3 } from "lucide-react";
import type { ReactNode } from "react";
import { IconContainer } from "@/shared/components/icon-container";

export function RecentActivityCard({ children }: { children: ReactNode }) {
	return (
		<section
			aria-labelledby="recent-activity-heading"
			className="animate-rise h-full flex min-w-0 flex-1 flex-col rounded-xl border border-border/70 bg-card p-4 sm:p-5"
		>
			{/* Header */}
			<div className="flex min-w-0 items-center gap-3">
				<IconContainer icon={Clock3} />

				<div className="min-w-0 flex-1">
					<h2
						id="recent-activity-heading"
						className="wrap-break-word text-sm font-semibold tracking-tight"
					>
						Actividad reciente
					</h2>

					<p className="mt-0.5 wrap-break-word text-xs text-muted-foreground">
						Últimos movimientos del espacio
					</p>
				</div>
			</div>

			{children}
		</section>
	);
}
