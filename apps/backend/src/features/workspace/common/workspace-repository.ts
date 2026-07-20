import type {
	Pagination,
	SortDirection,
} from "@serviceflow/backend/shared/pagination";
import type {
	WorkspaceCursor,
	WorkspaceOrderBy,
} from "../paginated-workspaces";
import type { Workspace } from "./workspace.model";
import type { WorkspaceReadModel } from "./workspace.read-model";

export interface WorkspaceRepository {
	save: (model: Workspace) => Promise<void>;
	update: (model: Workspace) => Promise<void>;
	getById: (workspaceId: string) => Promise<Workspace | null>;
	getAllPaginated(params: {
		limit: number;
		cursor?: WorkspaceCursor;
		orderBy: WorkspaceOrderBy;
		direction: SortDirection;
		search?: string;
		userId: string;
	}): Promise<Pagination<WorkspaceReadModel>>;
}
