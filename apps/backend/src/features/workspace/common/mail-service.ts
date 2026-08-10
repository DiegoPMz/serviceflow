export interface SendWorkspaceInvitationParams {
	to: string;
	workspaceName: string;
	inviterEmail: string;
	role: string;
	acceptUrl: string;
}

export interface MailService {
	sendWorkspaceInvitation: (
		params: SendWorkspaceInvitationParams,
	) => Promise<void>;
}
