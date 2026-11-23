import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import type { WorkspaceMemberListItem } from "@/features/workpace/paginated-workspace-members";
import { useRemoveWorkspaceMember } from "@/features/workpace/remove-workspace-member";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import type { Eden } from "@/shared/http/client";
import { formatMemberName } from "../team.presentation";

interface RemoveMemberDialogProps {
	eden: Eden;
	workspaceId: string;
	member: WorkspaceMemberListItem;
	workspaceName: string;
	onClose: () => void;
}

export function RemoveMemberDialog({
	eden,
	workspaceId,
	member,
	workspaceName,
	onClose,
}: RemoveMemberDialogProps) {
	const removeMember = useRemoveWorkspaceMember();
	const memberName = formatMemberName(member);

	function handleConfirm() {
		removeMember.mutate(
			{
				eden,
				workspaceId,
				memberId: member.userId,
				memberName,
			},
			{ onSuccess: onClose },
		);
	}

	return (
		<AlertDialog
			open
			onOpenChange={(open) => {
				if (!open && !removeMember.isPending) onClose();
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogMedia className="bg-destructive/15 text-destructive">
						<AlertTriangle />
					</AlertDialogMedia>
					<AlertDialogTitle>Eliminar del espacio de trabajo</AlertDialogTitle>
					<AlertDialogDescription>
						Confirma si deseas retirar el acceso de este integrante a{" "}
						{workspaceName}.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="rounded-xl border border-destructive/25 bg-destructive/8 p-3.5 text-xs leading-relaxed">
					<p className="truncate font-semibold text-foreground">
						{memberName} ({member.email})
					</p>
					<p className="mt-1 text-muted-foreground">
						Perderá inmediatamente el acceso a las órdenes de servicio, clientes
						y dispositivos registrados en este espacio de trabajo.
					</p>
				</div>

				<AlertDialogFooter>
					<AlertDialogCancel disabled={removeMember.isPending}>
						Cancelar
					</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						disabled={removeMember.isPending}
						onClick={handleConfirm}
					>
						{removeMember.isPending ? (
							<>
								<Loader2 className="size-4 animate-spin" />
								Eliminando…
							</>
						) : (
							<>
								<Trash2 className="size-4" />
								Eliminar miembro
							</>
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
