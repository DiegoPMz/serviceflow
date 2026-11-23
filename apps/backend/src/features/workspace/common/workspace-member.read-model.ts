import type { WorkspaceRole } from "./workspace-member.model";

export interface WorkspaceMemberReadModel {
	userId: string;
	name: string;
	lastName: string | null;
	email: string;
	pictureUrl: string | null;
	role: WorkspaceRole;
	joinedAt: string;
}
