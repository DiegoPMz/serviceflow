import { SuccessNotViewerSteps } from "./success-not-viewer-steps";
import { ViewerEmptySteps } from "./viewer-empty-steps";

type OnboardingSectionProps = {
	canCreateOrders: boolean;
	canCreateClients: boolean;
	canInviteMembers: boolean;
};

export function OnboardingSection({
	canCreateOrders,
	canCreateClients,
	canInviteMembers,
}: OnboardingSectionProps) {
	const isReadOnly = !canCreateOrders && !canCreateClients;

	return (
		<section
			aria-labelledby="onboarding-heading"
			className="animate-rise min-w-0 rounded-xl border border-border/70 bg-card p-4 sm:p-5"
		>
			<div className="flex items-center gap-3">
				<div className="min-w-0">
					<h2
						id="onboarding-heading"
						className="text-sm font-semibold tracking-tight"
					>
						{isReadOnly ? "Qué encontrarás aquí" : "Primeros pasos"}
					</h2>

					<p className="mt-0.5 text-xs text-muted-foreground">
						{isReadOnly
							? "Información disponible para tu acceso"
							: "Prepara tu flujo de trabajo"}
					</p>
				</div>
			</div>

			<div className="mt-5">
				{isReadOnly ? (
					<ViewerEmptySteps />
				) : (
					<SuccessNotViewerSteps canInviteMembers={canInviteMembers} />
				)}
			</div>
		</section>
	);
}
