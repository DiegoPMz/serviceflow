import {
	Cursor,
	type PaginationCursor,
} from "@serviceflow/backend/shared/pagination";
import type {
	Pagination,
	SortDirection,
} from "@serviceflow/backend/shared/pagination/types";
import { Result } from "@serviceflow/backend/shared/result";
import {
	WORKSPACE_ROLES,
	type WorkspaceRole,
} from "../workspace/common/workspace-member.model";
import type { WorkspaceMemberRepository } from "../workspace/common/workspace-member.repository";
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
	currentUserId: string;
};

interface PaginatedUsersProps {
	query: PaginatedUsersQuery;
	repository: UserRepository;
	memberRepository: WorkspaceMemberRepository;
}

const ROLE_VISIBILITY: readonly WorkspaceRole[] = [
	WORKSPACE_ROLES.OWNER,
	WORKSPACE_ROLES.ADMIN,
];

export const paginatedUserHandler = async ({
	query,
	repository,
	memberRepository,
}: PaginatedUsersProps): Promise<Result<Pagination<UserDetailsReadModel>>> => {
	const { paginationRequest: pagination, currentUserId } = query;

	const cursor = Cursor.validate<UserCursor>(pagination);

	if (cursor.isFailure) {
		return Result.failure(cursor.error);
	}

	const membership = await memberRepository.findMembership({
		userId: currentUserId,
		workspaceId: query.workspaceId,
	});

	const canViewRoles =
		membership !== null && ROLE_VISIBILITY.includes(membership.role);

	const users = await repository.getAllPaginated({
		limit: pagination.limit,
		search: pagination.search,
		orderBy: pagination.orderBy,
		direction: pagination.direction,
		cursor: cursor.value ?? undefined,
		workspaceId: query.workspaceId,
	});

	if (canViewRoles) {
		return Result.success(users);
	}

	const usersWithoutRoles: Pagination<UserDetailsReadModel> = {
		...users,
		items: users.items.map((u) => ({ ...u, role: undefined })),
	};

	return Result.success(usersWithoutRoles);
};
