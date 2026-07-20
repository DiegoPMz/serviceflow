import type { Pagination } from "@serviceflow/backend/shared/pagination";
import type { SortDirection } from "@serviceflow/backend/shared/pagination/types";
import type { ClientCursor, ClientOrderBy } from "../paginated-clients";
import type { Client } from "./client.model";
import type { ClientReadModel } from "./client.read-model";

export interface ClientRepository {
	clientExists: (data: { email: string; phone: string }) => Promise<boolean>;
	save: (model: Client) => Promise<void>;
	getByIds: (clientId: string, workspaceId: string) => Promise<Client | null>;
	getAllPaginated(params: {
		limit: number;
		cursor?: ClientCursor;
		orderBy: ClientOrderBy;
		direction: SortDirection;
		search?: string;
		workspaceId: string;
	}): Promise<Pagination<ClientReadModel>>;
}
