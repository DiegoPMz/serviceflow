import type { WorkspaceInvitationStatus } from "./workspace-invitation.model";

export type WorkspaceInvitationReadModelStatus = Exclude<
	WorkspaceInvitationStatus,
	"cancelled"
>;

export interface WorkspaceInvitationReadModel {
	token: string;
	email: string;
	status: WorkspaceInvitationReadModelStatus;
	issuedAt: string;
}
