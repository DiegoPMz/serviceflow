import { Result } from "@serviceflow/backend/shared/result";
import { workspaceMemberErrors } from "./workspace-member.errors";
import type { WorkspaceRole } from "./workspace-member.model";
import type { WorkspaceMemberRepository } from "./workspace-member.repository";

export interface AuthorizeWorkspaceInput {
	workspaceId: string;
	userId: string;
	requiredRoles: WorkspaceRole[];
}

export interface WorkspaceAuthorizationProps {
	membersRepository: WorkspaceMemberRepository;
}

export interface WorkspaceAuthorization {
	excecute: (
		input: AuthorizeWorkspaceInput,
	) => Promise<Result<WorkspaceRole[]>>;
}

export const workspaceAuthorization = ({
	membersRepository,
}: WorkspaceAuthorizationProps): WorkspaceAuthorization => ({
	excecute: async (
		input: AuthorizeWorkspaceInput,
	): Promise<Result<WorkspaceRole[]>> => {
		const membership = await membersRepository.findMembership({
			userId: input.userId,
			workspaceId: input.workspaceId,
		});

		if (membership.length < 1) {
			return Result.failure(workspaceMemberErrors.NOT_A_MEMBER);
		}

		const hasAccess = input.requiredRoles.some((role) =>
			membership.includes(role),
		);

		if (!hasAccess) {
			return Result.failure(workspaceMemberErrors.INSUFFICIENT_PERMISSIONS);
		}

		return Result.success(membership);
	},
});
