import type { WorkspaceRole } from "../../workspace/common/workspace-member.model";

export interface UserDetailsReadModel {
	id: string;
	role?: WorkspaceRole;
	email: string;
	name: string;
	lastName: string;
	pictureUrl: string | null;
	phone: string | null;
}
