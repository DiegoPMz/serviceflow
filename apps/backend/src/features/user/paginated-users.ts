import {
	Cursor,
	type PaginationCursor,
} from "@serviceflow/backend/shared/pagination";
import type {
	Pagination,
	SortDirection,
} from "@serviceflow/backend/shared/pagination/types";
import { Result } from "@serviceflow/backend/shared/result";
import type { WorkspaceRole } from "../workspace/common/workspace-member.model";
import type { UserDetailsReadModel } from "./common/user-details.read-model";
import type { UserRepository } from "./common/user-repository";

export type UserOrderBy =
	| "id"
	| "name"
	| "lastName"
	| "email"
	| "createdAt"
	| "updatedAt";

interface PaginationUserRequest {
	limit: number;
	cursor?: string;
	orderBy: UserOrderBy;
	direction: SortDirection;
	search?: string;
}

export type UserCursor = PaginationCursor<UserOrderBy, string | number>;

type PaginatedUsersQuery = {
	paginationRequest: PaginationUserRequest;
	workspaceId: string;
	currentUserRoles: WorkspaceRole[];
};

interface PaginatedUsersProps {
	query: PaginatedUsersQuery;
	repository: UserRepository;
}

export const paginatedUserHandler = async ({
	query,
	repository,
}: PaginatedUsersProps): Promise<Result<Pagination<UserDetailsReadModel>>> => {
	const { paginationRequest: pagination, currentUserRoles } = query;

	const cursor = Cursor.validate<UserCursor>(pagination);

	if (cursor.isFailure) {
		return Result.failure(cursor.error);
	}

	const users = await repository.getAllPaginated({
		limit: pagination.limit,
		search: pagination.search,
		orderBy: pagination.orderBy,
		direction: pagination.direction,
		cursor: cursor.value ?? undefined,
		workspaceId: query.workspaceId,
	});

	if (
		currentUserRoles.includes("owner") ||
		currentUserRoles.includes("admin")
	) {
		return Result.success(users);
	}

	const usersWithoutRoles: Pagination<UserDetailsReadModel> = {
		...users,
		items: users.items.map((u) => ({ ...u, role: undefined })),
	};

	return Result.success(usersWithoutRoles);
};
