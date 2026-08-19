import type { Transactional } from "@serviceflow/backend/shared/database";
import type {
	Pagination,
	SortDirection,
} from "@serviceflow/backend/shared/pagination";
import type {
	WorkspaceInvitationCursor,
	WorkspaceInvitationOrderBy,
} from "../paginated-workspace-invitations";
import type { WorkspaceInvitation } from "./workspace-invitation.model";
import type { WorkspaceInvitationReadModel } from "./workspace-invitation.read-model";

export interface WorkspaceInvitationRepository
	extends Transactional<WorkspaceInvitationRepository> {
	save(invitation: WorkspaceInvitation): Promise<void>;

	update(invitation: WorkspaceInvitation): Promise<void>;

	findByToken(token: string): Promise<WorkspaceInvitation | null>;

	deleteByToken(token: string): Promise<void>;

	findByEmailAndWorkspace(
		email: string,
		workspaceId: string,
	): Promise<WorkspaceInvitation | null>;

	getAllPaginated(params: {
		workspaceId: string;
		createdAfter: Date;
		limit: number;
		cursor?: WorkspaceInvitationCursor;
		orderBy: WorkspaceInvitationOrderBy;
		direction: SortDirection;
	}): Promise<Pagination<WorkspaceInvitationReadModel>>;
}
