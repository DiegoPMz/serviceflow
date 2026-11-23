import type { WorkspaceMemberListItem } from "@/features/workpace/paginated-workspace-members";

export function formatMemberName(
	member: Pick<WorkspaceMemberListItem, "name" | "lastName">,
): string {
	return `${member.name} ${member.lastName ?? ""}`.trim();
}
