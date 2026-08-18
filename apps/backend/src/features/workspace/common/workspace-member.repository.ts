import type { WorkspaceMember } from "./workspace-member.model";

export interface WorkspaceMemberRepository {
	update(member: WorkspaceMember): Promise<void>;

	existsByEmailAndWorkspace(
		email: string,
		workspaceId: string,
	): Promise<boolean>;

	addMember(member: WorkspaceMember): Promise<void>;

	findMembership: (values: {
		userId: string;
		workspaceId: string;
	}) => Promise<WorkspaceMember | null>;
}
