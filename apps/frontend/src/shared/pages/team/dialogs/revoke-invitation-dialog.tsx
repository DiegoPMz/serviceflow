import { Loader2 } from "lucide-react";
import { useCancelWorkspaceInvitation } from "@/features/workpace/cancel-workspace-invitation";
import type { WorkspaceInvitationListItem } from "@/features/workpace/paginated-workspace-invitations";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import type { Eden } from "@/shared/http/client";
import { formatRelativeTime } from "@/shared/lib/format-relative-time";
import { RoleBadge } from "../components/team-role-badge";

interface RevokeInvitationDialogProps {
	eden: Eden;
	workspaceId: string;
	invitation: WorkspaceInvitationListItem;
	onClose: () => void;
}

export function RevokeInvitationDialog({
	eden,
	workspaceId,
	invitation,
	onClose,
}: RevokeInvitationDialogProps) {
	const cancelInvitation = useCancelWorkspaceInvitation();

	function handleConfirm() {
		cancelInvitation.mutate(
			{ eden, workspaceId, token: invitation.token },
			{ onSuccess: onClose },
		);
	}

	return (
		<AlertDialog
			open
			onOpenChange={(open) => {
				if (!open && !cancelInvitation.isPending) onClose();
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Revocar invitación</AlertDialogTitle>
					<AlertDialogDescription>
						El enlace enviado dejará de ser válido para unirse al espacio de
						trabajo.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/45 px-3.5 py-3">
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold">{invitation.email}</p>
						<p className="mt-0.5 text-xs text-muted-foreground">
							Enviada: {formatRelativeTime(invitation.issuedAt).label}
						</p>
					</div>
					<RoleBadge role={invitation.role} />
				</div>

				<AlertDialogFooter>
					<AlertDialogCancel disabled={cancelInvitation.isPending}>
						Cancelar
					</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						disabled={cancelInvitation.isPending}
						onClick={handleConfirm}
					>
						{cancelInvitation.isPending ? (
							<>
								<Loader2 className="size-4 animate-spin" />
								Revocando…
							</>
						) : (
							"Revocar invitación"
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
