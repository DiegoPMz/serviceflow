export interface SendWorkspaceInvitationParams {
	to: string;
	workspaceName: string;
	inviterEmail: string;
	role: string;
	acceptUrl: string;
}

export interface SendWorkspaceResponse {
	emailId: string;
}

export interface MailService {
	sendWorkspaceInvitation: (
		params: SendWorkspaceInvitationParams,
	) => Promise<SendWorkspaceResponse>;

	cancelInvitationEmail: (emailId: string) => Promise<void>;
}
