import {
	Cursor,
	type Pagination,
	type PaginationCursor,
	PaginationErrors,
	type SortDirection,
} from "@serviceflow/backend/shared/pagination";
import { Result } from "@serviceflow/backend/shared/result";
import type { WorkspaceAuthorization } from "./common/workspace-authorization";
import type { WorkspaceInvitationReadModel } from "./common/workspace-invitation.read-model";
import type { WorkspaceInvitationRepository } from "./common/workspace-invitation-repository";
import { WORKSPACE_ROLES } from "./common/workspace-member.model";

export type WorkspaceInvitationOrderBy = "createdAt";

export type WorkspaceInvitationCursor = PaginationCursor<
	WorkspaceInvitationOrderBy,
	string
> & {
	workspaceId: string;
};

export const INVITATION_LISTING_WINDOW_DAYS = 30;

interface PaginationInvitationsRequest {
	limit: number;
	cursor?: string;
	orderBy: WorkspaceInvitationOrderBy;
	direction: SortDirection;
}

interface GetPaginatedWorkspaceInvitationsQuery {
	readonly workspaceId: string;
	readonly requesterUserId: string;
	readonly paginationRequest: PaginationInvitationsRequest;
}

interface PaginatedWorkspaceInvitationsProps {
	query: GetPaginatedWorkspaceInvitationsQuery;
	repository: WorkspaceInvitationRepository;
	authorization: WorkspaceAuthorization;
}

export const getPaginatedWorkspaceInvitations = async ({
	query,
	repository,
	authorization,
}: PaginatedWorkspaceInvitationsProps): Promise<
	Result<Pagination<WorkspaceInvitationReadModel>>
> => {
	const { paginationRequest: pagination, workspaceId, requesterUserId } = query;

	const authResult = await authorization.excecute({
		workspaceId,
		userId: requesterUserId,
		requiredRoles: [WORKSPACE_ROLES.OWNER, WORKSPACE_ROLES.ADMIN],
	});

	if (authResult.isFailure) {
		return Result.failure(authResult.error);
	}

	const cursor = Cursor.validate<WorkspaceInvitationCursor>(pagination);

	if (cursor.isFailure) {
		return Result.failure(cursor.error);
	}

	if (cursor.value && cursor.value.workspaceId !== workspaceId) {
		return Result.failure(PaginationErrors.PAGINATION_CURSOR_INVALID);
	}

	const createdAfter = new Date(
		Date.now() - INVITATION_LISTING_WINDOW_DAYS * 24 * 60 * 60 * 1000,
	);

	const invitations = await repository.getAllPaginated({
		workspaceId,
		createdAfter,
		limit: pagination.limit,
		orderBy: pagination.orderBy,
		direction: pagination.direction,
		cursor: cursor.value ?? undefined,
	});

	return Result.success(invitations);
};
