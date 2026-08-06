import {
	Cursor,
	type Pagination,
	type PaginationCursor,
	type SortDirection,
} from "@serviceflow/backend/shared/pagination";
import { Result } from "@serviceflow/backend/shared/result";
import type { WorkspaceReadModel } from "./common/workspace.read-model";
import type { WorkspaceRepository } from "./common/workspace-repository";

export type WorkspaceOrderBy = "updatedAt" | "name" | "id";

interface PaginationWorkspaceRequest {
	limit: number;
	cursor?: string;
	orderBy: WorkspaceOrderBy;
	direction: SortDirection;
	search?: string;
}

export type WorkspaceCursor = PaginationCursor<WorkspaceOrderBy, string | Date>;

interface GetPaginatedWorkspacesQuery {
	readonly paginationRequest: PaginationWorkspaceRequest;
	readonly userId: string;
}

interface PaginatedWorkspaceProps {
	query: GetPaginatedWorkspacesQuery;
	repository: WorkspaceRepository;
}

export const getPaginatedWorkspaces = async ({
	query,
	repository,
}: PaginatedWorkspaceProps): Promise<
	Result<Pagination<WorkspaceReadModel>>
> => {
	const { paginationRequest: pagination, userId } = query;

	const cursor = Cursor.validate<WorkspaceCursor>(pagination);

	if (cursor.isFailure) {
		return Result.failure(cursor.error);
	}

	const workspaces = await repository.getAllPaginated({
		limit: pagination.limit,
		search: pagination.search,
		orderBy: pagination.orderBy,
		direction: pagination.direction,
		cursor: cursor.value ?? undefined,
		userId,
	});

	return Result.success(workspaces);
};
