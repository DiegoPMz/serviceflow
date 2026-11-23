import { Search } from "lucide-react";
import type { WorkspaceRole } from "@/features/workpace/common/workspace-role";
import type { WorkspaceMemberListItem } from "@/features/workpace/paginated-workspace-members";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import type { TeamMembersState } from "../team.types";
import { MemberRowCard, MemberRowCardSkeleton } from "./member-row-card";
import { TeamSectionError, TeamSectionErrorNotice } from "./team-query-states";

interface MembersSectionProps {
	members: TeamMembersState;
	canManage: (role: WorkspaceRole) => boolean;
	onChangeRole: (member: WorkspaceMemberListItem) => void;
	onRemove: (member: WorkspaceMemberListItem) => void;
}

export function MembersSection({
	members,
	canManage,
	onChangeRole,
	onRemove,
}: MembersSectionProps) {
	const { items, search, onSearchChange, query } = members;

	const hasItems = items.length > 0;
	const hasBlockingError = query.isError && !hasItems;

	return (
		<section
			aria-label="Miembros del espacio de trabajo"
			className="animate-rise rounded-xl bg-card p-4 ring ring-border/70 sm:p-6"
		>
			<div className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<div className="flex items-center gap-2.5">
						<h2 className="text-lg font-semibold">Integrantes del equipo</h2>
						<span className="inline-flex items-center justify-center rounded-full border border-border bg-background/80 px-2.5 py-0.5 font-mono text-xs font-semibold text-foreground">
							{items.length}
							{query.hasNextPage ? "+" : null}
						</span>
					</div>
					<p className="mt-0.5 text-xs text-muted-foreground">
						Personas con acceso activo y su nivel de permisos en el espacio de
						trabajo.
					</p>
				</div>

				{(hasItems || search.length > 0) && (
					<div className="relative w-full sm:w-64">
						<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							value={search}
							onChange={(event) => onSearchChange(event.target.value)}
							placeholder="Buscar integrante..."
							aria-label="Buscar integrantes"
							className="pl-9"
						/>
					</div>
				)}
			</div>

			<div className="mt-4 space-y-2.5">
				{query.isPending ? (
					[1, 2, 3].map((index) => <MemberRowCardSkeleton key={index} />)
				) : hasBlockingError ? (
					<TeamSectionError
						title="No pudimos cargar los miembros"
						description="Ocurrió un problema al obtener la lista de miembros del espacio de trabajo. Intenta nuevamente."
						onRetry={query.refetch}
					/>
				) : (
					<>
						{query.isRefetchError && (
							<TeamSectionErrorNotice
								title="No se pudo actualizar la lista de miembros"
								description="Los datos disponibles se mantienen visibles."
								onRetry={query.refetch}
							/>
						)}

						{query.isFetchNextPageError && (
							<TeamSectionErrorNotice
								title="No se pudieron cargar más integrantes"
								description="La lista actual se mantiene; puedes reintentar la carga."
								onRetry={query.onLoadMore}
							/>
						)}

						{hasItems ? (
							items.map((member) => (
								<MemberRowCard
									key={member.userId}
									member={member}
									canManage={canManage(member.role)}
									onChangeRole={() => onChangeRole(member)}
									onRemove={() => onRemove(member)}
								/>
							))
						) : (
							<div className="rounded-xl border border-dashed border-border bg-background/40 px-4 py-10 text-center">
								<Search className="mx-auto size-5 text-muted-foreground" />
								<p className="mt-2.5 text-sm font-semibold">
									No se encontraron miembros
								</p>
								<p className="mt-1 text-xs text-muted-foreground">
									Prueba con otro nombre o dirección de correo electrónico.
								</p>
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
