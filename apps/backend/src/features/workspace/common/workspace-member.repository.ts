import type {
	Pagination,
	SortDirection,
} from "@serviceflow/backend/shared/pagination";
import type {
	WorkspaceMemberCursor,
	WorkspaceMemberOrderBy,
} from "../paginated-workspace-members";
import type { WorkspaceMember } from "./workspace-member.model";
import type { WorkspaceMemberReadModel } from "./workspace-member.read-model";

export interface WorkspaceMemberRepository {
	update(member: WorkspaceMember): Promise<void>;

	remove(member: WorkspaceMember): Promise<void>;

	existsByEmailAndWorkspace(
		email: string,
		workspaceId: string,
	): Promise<boolean>;

	addMember(member: WorkspaceMember): Promise<void>;

	findMembership: (values: {
		userId: string;
		workspaceId: string;
	}) => Promise<WorkspaceMember | null>;

	getAllPaginated(params: {
		workspaceId: string;
		limit: number;
		cursor?: WorkspaceMemberCursor;
		orderBy: WorkspaceMemberOrderBy;
		direction: SortDirection;
		search?: string;
	}): Promise<Pagination<WorkspaceMemberReadModel>>;
}
