import { BookOpen, Shield, ShieldCheck, Wrench } from "lucide-react";
import type { WorkspaceRole } from "@/features/workpace/common/workspace-role";
import { WORKSPACE_ROLE_LABELS } from "@/features/workpace/common/workspace-role";
import { Badge } from "@/shared/components/ui/badge";

export function RoleBadge({ role }: { role: WorkspaceRole }) {
	const label = WORKSPACE_ROLE_LABELS[role];

	switch (role) {
		case "owner":
			return (
				<Badge
					variant="outline"
					className="gap-1 bg-foreground/6 px-2.5 py-0.5 text-[11px] font-medium"
				>
					<ShieldCheck className="size-3  text-amber-600" />
					{label}
				</Badge>
			);
		case "admin":
			return (
				<Badge
					variant="outline"
					className="gap-1 bg-foreground/6 px-2.5 py-0.5 text-[11px] font-medium text-foreground"
				>
					<Shield className="size-3 text-amber-600" />
					{label}
				</Badge>
			);
		case "technician":
			return (
				<Badge
					variant="outline"
					className="gap-1 px-2.5 py-0.5 text-[11px] font-medium"
				>
					<Wrench className="size-3 text-primary" />
					{label}
				</Badge>
			);
		case "viewer":
			return (
				<Badge
					variant="outline"
					className="gap-1 px-2.5 py-0.5 text-[11px] font-medium"
				>
					<BookOpen className="size-3 text-primary" />
					{label}
				</Badge>
			);
	}
}
