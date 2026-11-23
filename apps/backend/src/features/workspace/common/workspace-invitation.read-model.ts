import type {
	InvitationRole,
	WorkspaceInvitationStatus,
} from "./workspace-invitation.model";

export type WorkspaceInvitationReadModelStatus = Exclude<
	WorkspaceInvitationStatus,
	"cancelled"
>;

export interface WorkspaceInvitationReadModel {
	token: string;
	email: string;
	role: InvitationRole;
	status: WorkspaceInvitationReadModelStatus;
	issuedAt: string;
}
