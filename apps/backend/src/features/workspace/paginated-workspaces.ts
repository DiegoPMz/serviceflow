import type { PublicAssetStorage } from "@serviceflow/backend/shared/object-storage/storage-service";
import {
    Cursor,
    type Pagination,
    type PaginationCursor,
    type SortDirection,
} from "@serviceflow/backend/shared/pagination";
import { Result } from "@serviceflow/backend/shared/result";
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

export interface PaginatedWorkspacesDto {
	id: string;
	logo: string | null;
	name: string;
	totalUsers: number;
	totalClientes: number;
	updatedAt: string;
}

interface PaginatedWorkspaceProps {
	query: GetPaginatedWorkspacesQuery;
	repository: WorkspaceRepository;
	publicAssetStorage: PublicAssetStorage;
}

export const getPaginatedWorkspaces = async ({
	query,
	repository,
	publicAssetStorage,
}: PaginatedWorkspaceProps): Promise<
	Result<Pagination<PaginatedWorkspacesDto>>
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

	return Result.success({
		cursor: workspaces.cursor,
		hasNextPage: workspaces.hasNextPage,
		items: workspaces.items.map((w) => ({
			...w,
			logo: w.logo !== null ? publicAssetStorage.getPublicUrl(w.logo) : null,
		})),
	});
};
