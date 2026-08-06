import { Result } from "@serviceflow/backend/shared/result";
import { workspaceErrors } from "./workspace.errors";
import type { WorkspaceRole } from "./workspace.model";
import type { WorkspaceRepository } from "./workspace-repository";

export interface AuthorizeWorkspaceInput {
	workspaceId: string;
	userId: string;
	requiredRoles: WorkspaceRole[];
}

export interface WorkspaceAuthorizationProps {
	workspaceRepository: WorkspaceRepository;
}

export interface WorkspaceAuthorization {
	excecute: (
		input: AuthorizeWorkspaceInput,
	) => Promise<Result<WorkspaceRole[]>>;
}

export const workspaceAuthorization = ({
	workspaceRepository,
}: WorkspaceAuthorizationProps): WorkspaceAuthorization => ({
	excecute: async (
		input: AuthorizeWorkspaceInput,
	): Promise<Result<WorkspaceRole[]>> => {
		const membership = await workspaceRepository.findMembership({
			userId: input.userId,
			workspaceId: input.workspaceId,
		});

		if (membership.length < 1) {
			return Result.failure(workspaceErrors.NOT_A_MEMBER);
		}

		const hasAccess = input.requiredRoles.some((role) =>
			membership.includes(role),
		);

		if (!hasAccess) {
			return Result.failure(workspaceErrors.INSUFFICIENT_PERMISSIONS);
		}

		return Result.success(membership);
	},
});
