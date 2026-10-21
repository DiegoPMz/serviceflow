import { UserPlus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export function SuccessNotViewerSteps({
	canInviteMembers,
}: {
	canInviteMembers: boolean;
}) {
	const steps = [
		{
			key: "clients",
			title: "Registra tus clientes",
			description:
				"Centraliza sus datos para tenerlos disponibles al gestionar tus servicios.",
		},

		{
			key: "orders",
			title: "Crea una orden de servicio",
			description:
				"Documenta el equipo, el problema reportado y el trabajo realizado.",
		},
	];

	return (
		<>
			<ol className="flex flex-col gap-5">
				{steps.map((step, index) => (
					<li key={step.key} className="flex min-w-0 gap-3">
						<span
							aria-hidden="true"
							className="mt-0.5 grid size-5.25 shrink-0 place-items-center rounded-full bg-muted/40 text-[10px] font-semibold tabular-nums text-muted-foreground outline-2 outline-muted/80"
						>
							{String(index + 1).padStart(2, "0")}
						</span>

						<div className="min-w-0 flex-1">
							<p className="text-sm font-semibold leading-5">{step.title}</p>

							<p className="mt-1.5 wrap-break-word text-xs leading-5 text-muted-foreground ">
								{step.description}
							</p>
						</div>
					</li>
				))}
			</ol>

			{canInviteMembers && (
				<div className="mt-4 flex flex-col space-y-4 border-t border-border/70 pt-2">
					<p className="text-xs leading-5 text-muted-foreground text-center">
						Ambas rutas terminan en una{" "}
						<span className="font-medium text-foreground">
							orden de servicio
						</span>
						.
					</p>
					<Button
						variant="outline"
						size="lg"
						className="w-full justify-center gap-2.5"
					>
						<UserPlus className="size-4" />
						Invitar a mi equipo
					</Button>
				</div>
			)}
		</>
	);
}
