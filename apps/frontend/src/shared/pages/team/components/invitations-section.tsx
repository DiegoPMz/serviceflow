import { Mail, UserPlus } from "lucide-react";
import type { WorkspaceInvitationListItem } from "@/features/workpace/paginated-workspace-invitations";
import { Button } from "@/shared/components/ui/button";
import type { TeamInvitationsState } from "../team.types";
import {
	InvitationRowCard,
	InvitationRowCardSkeleton,
} from "./invitation-row-card";
import { TeamSectionError, TeamSectionErrorNotice } from "./team-query-states";

interface InvitationsSectionProps {
	invitations: TeamInvitationsState;
	onInvite: () => void;
	onRevoke: (invitation: WorkspaceInvitationListItem) => void;
}

export function InvitationsSection({
	invitations,
	onInvite,
	onRevoke,
}: InvitationsSectionProps) {
	const { items, resendingEmail, onResend, query } = invitations;

	const hasItems = items.length > 0;
	const hasBlockingError = query.isError && !hasItems;

	return (
		<section
			aria-label="Invitaciones del espacio de trabajo"
			className="animate-rise rounded-xl bg-card p-4 ring ring-border/70 sm:p-6"
		>
			<div className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-lg font-semibold">Invitaciones</h2>
					<p className="mt-0.5 text-xs text-muted-foreground">
						Administra las invitaciones enviadas a nuevos miembros del equipo.
					</p>
				</div>

				{hasItems && (
					<Button size="lg" onClick={onInvite} className="w-full sm:w-auto">
						<UserPlus className="size-3.5" />
						Invitar miembro
					</Button>
				)}
			</div>

			<div className="mt-4 space-y-2.5">
				{query.isPending ? (
					[1, 2, 3].map((index) => <InvitationRowCardSkeleton key={index} />)
				) : hasBlockingError ? (
					<TeamSectionError
						title="No pudimos cargar las invitaciones"
						description="Ocurrió un problema al obtener las invitaciones de este espacio de trabajo. Intenta nuevamente."
						onRetry={query.refetch}
					/>
				) : (
					<>
						{query.isRefetchError && (
							<TeamSectionErrorNotice
								title="No se pudo actualizar la lista de invitaciones"
								description="Los datos disponibles se mantienen visibles."
								onRetry={query.refetch}
							/>
						)}

						{query.isFetchNextPageError && (
							<TeamSectionErrorNotice
								title="No se pudieron cargar más invitaciones"
								description="La lista actual se mantiene; puedes reintentar la carga."
								onRetry={query.onLoadMore}
							/>
						)}

						{hasItems ? (
							items.map((invitation) => (
								<InvitationRowCard
									key={invitation.token}
									invitation={invitation}
									resending={resendingEmail === invitation.email}
									onResend={() => onResend(invitation)}
									onRevoke={() => onRevoke(invitation)}
								/>
							))
						) : (
							<div className="rounded-xl border border-border bg-card py-10 text-center">
								<div className="mx-auto grid size-9 place-items-center text-muted-foreground [&_svg]:size-6">
									<Mail />
								</div>

								<p className="mt-2 text-sm font-semibold">
									Sin invitaciones registradas
								</p>

								<p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
									Envía una invitación por correo electrónico para sumar nuevos
									colaboradores al espacio de trabajo.
								</p>

								<Button size="lg" onClick={onInvite} className="mt-4">
									<UserPlus className="size-3.5" />
									Invitar miembro
								</Button>
							</div>
						)}
					</>
				)}
			</div>

			{query.hasNextPage && !query.isFetchNextPageError && (
				<div className="mt-4 flex justify-center">
					<Button
						type="button"
						variant="outline"
						onClick={query.onLoadMore}
						disabled={query.isFetchingNextPage}
					>
						{query.isFetchingNextPage ? "Cargando..." : "Cargar más"}
					</Button>
				</div>
			)}
		</section>
	);
}
