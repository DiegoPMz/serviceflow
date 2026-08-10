import { render } from "@react-email/components";
import WorkspaceInvitationEmail from "@serviceflow/backend/shared/emails/workspace-invitation.email";
import {
	ErrorDetails,
	ErrorDetailsException,
} from "@serviceflow/backend/shared/result";
import type { ErrorResponse, Resend } from "resend";
import type {
	MailService,
	SendWorkspaceInvitationParams,
} from "./mail-service";

export interface ResendMailServiceConfig {
	resendClient: Resend;
	fromDomain: string;
	appName: string;
}

export const createResendMailService = ({
	fromDomain,
	resendClient,
	appName,
}: ResendMailServiceConfig): MailService => ({
	sendWorkspaceInvitation: async (
		params: SendWorkspaceInvitationParams,
	): Promise<void> => {
		const html = await render(
			WorkspaceInvitationEmail({
				workspaceName: params.workspaceName,
				inviterEmail: params.inviterEmail,
				role: params.role,
				acceptUrl: params.acceptUrl,
				appName: appName,
			}),
		);

		const { error } = await resendClient.emails.send({
			from: fromDomain,
			to: params.to,
			subject: `Te han invitado a unirte a ${params.workspaceName}`,
			html,
		});

		if (error) {
			throw ResendErrorDetailsException(error);
		}
	},
});

function ResendErrorDetailsException(error: ErrorResponse) {
	return ErrorDetailsException.of(
		new ErrorDetails(
			error.name ?? "ResendError",
			error.message,
			error.statusCode ?? 500,
		),
		error,
	);
}
