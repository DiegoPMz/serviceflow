import {
	Cursor,
	type Pagination,
	type PaginationCursor,
	type SortDirection,
} from "@serviceflow/backend/shared/pagination";
import { Result } from "@serviceflow/backend/shared/result";
import type { WorkspaceInvitationReadModel } from "./common/workspace-invitation.read-model";
import type { WorkspaceInvitationRepository } from "./common/workspace-invitation-repository";

export type WorkspaceInvitationOrderBy = "createdAt";

export type WorkspaceInvitationCursor = PaginationCursor<
	WorkspaceInvitationOrderBy,
	string
>;

export const INVITATION_LISTING_WINDOW_DAYS = 30;

interface PaginationInvitationsRequest {
	limit: number;
	cursor?: string;
	orderBy: WorkspaceInvitationOrderBy;
	direction: SortDirection;
}

interface GetPaginatedWorkspaceInvitationsQuery {
	readonly workspaceId: string;
	readonly paginationRequest: PaginationInvitationsRequest;
}

interface PaginatedWorkspaceInvitationsProps {
	query: GetPaginatedWorkspaceInvitationsQuery;
	repository: WorkspaceInvitationRepository;
}

export const getPaginatedWorkspaceInvitations = async ({
	query,
	repository,
}: PaginatedWorkspaceInvitationsProps): Promise<
	Result<Pagination<WorkspaceInvitationReadModel>>
> => {
	const { paginationRequest: pagination, workspaceId } = query;

	const cursor = Cursor.validate<WorkspaceInvitationCursor>(pagination);

	if (cursor.isFailure) {
		return Result.failure(cursor.error);
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
