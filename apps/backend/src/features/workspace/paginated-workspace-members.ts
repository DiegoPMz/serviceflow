import {
	Cursor,
	type Pagination,
	type PaginationCursor,
	PaginationErrors,
	type SortDirection,
} from "@serviceflow/backend/shared/pagination";
import { Result } from "@serviceflow/backend/shared/result";
import type { WorkspaceAuthorization } from "./common/workspace-authorization";
import { WORKSPACE_ROLES_ARRAY } from "./common/workspace-member.model";
import type { WorkspaceMemberReadModel } from "./common/workspace-member.read-model";
import type { WorkspaceMemberRepository } from "./common/workspace-member.repository";

export type WorkspaceMemberOrderBy = "joinedAt" | "name" | "email";

export type WorkspaceMemberCursor = PaginationCursor<
	WorkspaceMemberOrderBy,
	string | number
> & {
	workspaceId: string;
};

interface PaginationMembersRequest {
	limit: number;
	cursor?: string;
	orderBy: WorkspaceMemberOrderBy;
	direction: SortDirection;
	search?: string;
}

interface GetPaginatedWorkspaceMembersQuery {
	readonly workspaceId: string;
	readonly requesterUserId: string;
	readonly paginationRequest: PaginationMembersRequest;
}

interface PaginatedWorkspaceMembersProps {
	query: GetPaginatedWorkspaceMembersQuery;
	repository: WorkspaceMemberRepository;
	authorization: WorkspaceAuthorization;
}

export const getPaginatedWorkspaceMembers = async ({
	query,
	repository,
	authorization,
}: PaginatedWorkspaceMembersProps): Promise<
	Result<Pagination<WorkspaceMemberReadModel>>
> => {
	const { workspaceId, requesterUserId, paginationRequest: pagination } = query;

	const authResult = await authorization.excecute({
		workspaceId,
		userId: requesterUserId,
		requiredRoles: [...WORKSPACE_ROLES_ARRAY],
	});

	if (authResult.isFailure) {
		return Result.failure(authResult.error);
	}

	const cursor = Cursor.validate<WorkspaceMemberCursor>(pagination);

	if (cursor.isFailure) {
		return Result.failure(cursor.error);
	}

	if (cursor.value && cursor.value.workspaceId !== workspaceId) {
		return Result.failure(PaginationErrors.PAGINATION_CURSOR_INVALID);
	}

	const members = await repository.getAllPaginated({
		workspaceId,
		limit: pagination.limit,
		orderBy: pagination.orderBy,
		direction: pagination.direction,
		search: pagination.search,
		cursor: cursor.value ?? undefined,
	});

	return Result.success(members);
};
