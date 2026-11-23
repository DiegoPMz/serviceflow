import { cn } from "cn";
import type { WorkspaceInvitationListItem } from "@/features/workpace/paginated-workspace-invitations";
import { Badge } from "@/shared/components/ui/badge";

const INVITATION_STATUS_PRESENTATION: Record<
	WorkspaceInvitationListItem["status"],
	{ label: string; className: string }
> = {
	pending: {
		label: "Pendiente",
		className:
			"border-amber-400/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
	},
	accepted: {
		label: "Aceptada",
		className: "border-success/30 bg-success/10 text-success",
	},
	rejected: {
		label: "Rechazada",
		className: "border-destructive/30 bg-destructive/10 text-destructive",
	},
};

export function InvitationStatusBadge({
	status,
}: {
	status: WorkspaceInvitationListItem["status"];
}) {
	const { label, className } = INVITATION_STATUS_PRESENTATION[status];

	return (
		<Badge
			variant="outline"
			className={cn(
				"rounded-sm border-0 border-b-2 px-2.5 py-0.5 text-[11px] font-semibold",
				className,
			)}
		>
			{label}
		</Badge>
	);
}
