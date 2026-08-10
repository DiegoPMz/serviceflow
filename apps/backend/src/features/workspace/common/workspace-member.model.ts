import { Result } from "@serviceflow/backend/shared/result";
import { workspaceMemberErrors } from "./workspace-member.errors";

export const WORKSPACE_ROLES_ARRAY = [
	"owner",
	"admin",
	"technician",
	"viewer",
] as const;

export const WORKSPACE_ROLES = {
	OWNER: "owner",
	ADMIN: "admin",
	TECHNICIAN: "technician",
	VIEWER: "viewer",
} as const;

export type WorkspaceRole =
	(typeof WORKSPACE_ROLES)[keyof typeof WORKSPACE_ROLES];

export class WorkspaceMember {
	private constructor(
		public readonly workspaceId: string,
		public readonly userId: string,
		public readonly role: WorkspaceRole,
		public readonly joinedAt: Date,
		public readonly updatedAt: Date,
	) {}

	static create(props: {
		workspaceId: string;
		userId: string;
		role: WorkspaceRole;
	}): Result<WorkspaceMember> {
		const workspaceId = props.workspaceId.trim();
		const userId = props.userId.trim();

		if (workspaceId.length === 0) {
			return Result.failure(workspaceMemberErrors.WORKSPACE_ID_REQUIRED);
		}

		if (userId.length === 0) {
			return Result.failure(workspaceMemberErrors.USER_ID_REQUIRED);
		}

		if (!WORKSPACE_ROLES_ARRAY.includes(props.role)) {
			return Result.failure(workspaceMemberErrors.INVALID_ROLE);
		}

		const now = new Date();

		return Result.success(
			new WorkspaceMember(
				props.workspaceId,
				props.userId,
				props.role,
				now,
				now,
			),
		);
	}

	static reconstitute(props: {
		workspaceId: string;
		userId: string;
		role: WorkspaceRole;
		joinedAt: Date;
		updatedAt: Date;
	}): WorkspaceMember {
		return new WorkspaceMember(
			props.workspaceId,
			props.userId,
			props.role,
			props.joinedAt,
			props.updatedAt,
		);
	}
}
