import type { Transactional } from "@serviceflow/backend/shared/database";
import type { Pagination } from "@serviceflow/backend/shared/pagination";
import type { SortDirection } from "@serviceflow/backend/shared/pagination/types";
import type { UserCursor, UserOrderBy } from "../paginated-users";
import type { User } from "./user.model";
import type { UserDetailsReadModel } from "./user-details.read-model";

export interface UserRepository extends Transactional<UserRepository> {
	save: (user: User) => Promise<void>;
	getById: (id: string) => Promise<User | null>;
	getByExternalId(externalId: string): Promise<User | null>;
	getPictureUrlById: (id: string) => Promise<string | null>;
	getAllPaginated(params: {
		limit: number;
		cursor?: UserCursor;
		orderBy: UserOrderBy;
		direction: SortDirection;
		search?: string;
		workspaceId: string;
	}): Promise<Pagination<UserDetailsReadModel>>;
}
