import { Clock3, Loader2, RotateCw, Trash2, UserRound } from "lucide-react";
import type { WorkspaceInvitationListItem } from "@/features/workpace/paginated-workspace-invitations";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatRelativeTime } from "@/shared/lib/format-relative-time";
import { InvitationStatusBadge } from "./invitation-status-badge";
import { RoleBadge } from "./team-role-badge";

interface InvitationRowCardProps {
	invitation: WorkspaceInvitationListItem;
	resending: boolean;
	onResend: () => void;
	onRevoke: () => void;
}

export function InvitationRowCard({
	invitation,
	resending,
	onResend,
	onRevoke,
}: InvitationRowCardProps) {
	// Solo las pendientes se pueden reenviar o revocar (lo valida el backend).
	const isPending = invitation.status === "pending";

	return (
		<article className="animate-rise flex flex-col gap-3 rounded-xl border border-border/80 bg-card/50 p-4 transition-colors hover:bg-card sm:flex-row sm:items-center sm:justify-between sm:gap-5">
			<div className="min-w-0 flex-1 space-y-2">
				<div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
					<div className="inline">
						<span className="text-xs text-muted-foreground">Enviado a:</span>{" "}
						<p className="inline truncate text-sm font-semibold leading-tight">
							{invitation.email}
						</p>
					</div>

					<InvitationStatusBadge status={invitation.status} />
				</div>

				<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
					<span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
						<UserRound className="size-3.5 shrink-0 text-muted-foreground/80" />
						<span>Rol asignado:</span>
						<RoleBadge role={invitation.role} />
					</span>

					<span className="hidden h-3 w-px bg-border sm:block" />

					<span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
						<Clock3 className="size-3.5 shrink-0 text-muted-foreground/80" />
						Enviada {formatRelativeTime(invitation.issuedAt).label}
					</span>
				</div>
			</div>

			<div className="flex items-center gap-2 border-t border-border/70 pt-3 sm:shrink-0 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
				<Button
					type="button"
					variant="glass"
					size="sm"
					onClick={onResend}
					disabled={!isPending || resending}
					className="flex-1 sm:flex-initial"
				>
					{resending ? (
						<>
							<Loader2 className="size-3.5 animate-spin" />
							Reenviando…
						</>
					) : (
						<>
							<RotateCw className="size-3.5" />
							Reenviar
						</>
					)}
				</Button>

				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={onRevoke}
					disabled={!isPending}
					className="flex-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:flex-initial"
				>
					<Trash2 className="size-3.5" />
					Revocar
				</Button>
			</div>
		</article>
	);
}

export function InvitationRowCardSkeleton() {
	return (
		<article className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
			<div className="min-w-0 flex-1 space-y-2">
				<div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
					<Skeleton className="h-3 w-16" />
					<Skeleton className="h-4 w-44 max-w-[60%]" />
					<Skeleton className="h-5 w-16 rounded-full" />
				</div>

				<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
					<div className="inline-flex items-center gap-1.5">
						<Skeleton className="size-3.5 rounded-sm" />
						<Skeleton className="h-3 w-20" />
						<Skeleton className="h-5 w-14 rounded-full" />
					</div>

					<Skeleton className="hidden h-3 w-px sm:block" />

					<div className="inline-flex items-center gap-1.5">
						<Skeleton className="size-3.5 rounded-sm" />
						<Skeleton className="h-3 w-24" />
					</div>
				</div>
			</div>

			<div className="flex items-center gap-2 border-t border-border/70 pt-3 sm:shrink-0 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
				<Skeleton className="h-8 flex-1 rounded-md sm:w-24 sm:flex-initial" />
				<Skeleton className="h-8 flex-1 rounded-md sm:w-20 sm:flex-initial" />
			</div>
		</article>
	);
}
