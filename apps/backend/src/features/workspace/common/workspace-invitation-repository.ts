import type { Transactional } from "@serviceflow/backend/shared/database";
import type { WorkspaceInvitation } from "./workspace-invitation.model";

export interface WorkspaceInvitationRepository
	extends Transactional<WorkspaceInvitationRepository> {
	save(invitation: WorkspaceInvitation): Promise<void>;

	update(invitation: WorkspaceInvitation): Promise<void>;

	findByToken(token: string): Promise<WorkspaceInvitation | null>;

	deleteByToken(token: string): Promise<void>;

	findByEmailAndWorkspace(
		email: string,
		workspaceId: string,
	): Promise<WorkspaceInvitation | null>;
}
