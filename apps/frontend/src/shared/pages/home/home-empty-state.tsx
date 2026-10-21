import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { ClipboardList, Plus, Sparkles, Users } from "lucide-react";
import { IconContainer } from "@/shared/components/icon-container";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import { RecentActivitySection } from "@/shared/pages/home/recent-activity-section";
import { OnboardingSection } from "./onboarding-section";

type HomeEmptyStateProps = {
	canCreateOrders: boolean;
	canCreateClients: boolean;
	canInviteMembers: boolean;
};

export function HomeEmptyState({
	canCreateOrders,
	canCreateClients,
	canInviteMembers,
}: HomeEmptyStateProps) {
	const isReadOnly = !canCreateOrders && !canCreateClients;

	return (
		<div className="grid min-w-0 animate-rise grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
			{/* Main empty state */}
			<section
				aria-labelledby="empty-state-heading"
				className="min-w-0 h-full rounded-xl border border-border/70 bg-card p-5 sm:p-6 lg:col-span-8 lg:p-7"
			>
				{/* Heading */}
				<div className="flex items-center gap-3">
					<IconContainer
						className="size-10"
						iconClassName="size-6"
						icon={isReadOnly ? ClipboardList : Sparkles}
					/>

					<div className="min-w-0">
						<p className="text-[10px] font-semibold uppercase tracking-[0.14em] ">
							{isReadOnly ? "Sin actividad" : "Espacio preparado"}
						</p>

						<p className="mt-1 text-xs text-muted-foreground">
							{isReadOnly
								? "Todavía no hay órdenes registradas"
								: "Comienza a organizar tu operación"}
						</p>
					</div>
				</div>

				{/* Main message */}
				<div className="mt-7 max-w-2xl h-fit">
					<h2 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
						{isReadOnly
							? "Aún no hay órdenes que consultar."
							: canCreateOrders
								? "Tu espacio está listo para empezar."
								: "Comienza organizando tus clientes."}
					</h2>

					<p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
						{isReadOnly
							? "Cuando se registren órdenes de servicio, podrás consultar su información, estado e historial desde aquí."
							: canCreateOrders
								? "Registra tu primera orden de servicio o prepara tus clientes para mantener toda la información de tu operación organizada."
								: "Registra tus primeros clientes para centralizar sus datos y tener la información lista para tu operación."}
					</p>
				</div>

				{/* Available actions */}
				{(canCreateOrders || canCreateClients) && (
					<div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
						{canCreateOrders && (
							<Link
								from="/workspace/$workspaceId"
								to="/workspace/$workspaceId/orden/nueva"
								className={cn(
									buttonVariants({ size: "lg" }),
									"justify-start gap-2.5",
								)}
							>
								<Plus className="size-4" />
								Crear primera orden
							</Link>
						)}

						{canCreateClients && (
							<Button
								variant="secondary"
								size="lg"
								className="justify-start gap-2.5"
							>
								<Users className="size-4" />
								Agregar cliente
							</Button>
						)}
					</div>
				)}

				{/* Contextual footer */}
				<div className="mt-6 border-t border-border/70 pt-4">
					<p className="text-xs leading-5 text-muted-foreground">
						{isReadOnly
							? "El contenido aparecerá aquí conforme otros miembros registren actividad en el espacio."
							: "Las órdenes, los equipos asociados y su historial estarán disponibles desde tu espacio de trabajo."}
					</p>
				</div>
			</section>

			<aside className="flex min-w-0 flex-col gap-4 h-full lg:col-span-4">
				<RecentActivitySection
					emptyState={
						<OnboardingSection
							canCreateOrders={canCreateOrders}
							canCreateClients={canCreateClients}
							canInviteMembers={canInviteMembers}
						/>
					}
				/>
			</aside>
		</div>
	);
}
