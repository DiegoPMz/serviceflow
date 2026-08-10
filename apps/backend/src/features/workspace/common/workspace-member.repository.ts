import type { WorkspaceMember, WorkspaceRole } from "./workspace-member.model";

export interface WorkspaceMemberRepository {
	existsByEmailAndWorkspace(
		email: string,
		workspaceId: string,
	): Promise<boolean>;

	addMember(member: WorkspaceMember): Promise<void>;

	findMembership: (values: {
		userId: string;
		workspaceId: string;
	}) => Promise<WorkspaceRole[]>;
}
