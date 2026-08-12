import {
	Cursor,
	type PaginationCursor,
} from "@serviceflow/backend/shared/pagination";
import type {
	Pagination,
	SortDirection,
} from "@serviceflow/backend/shared/pagination/types";
import { Result } from "@serviceflow/backend/shared/result";
import type { ClientReadModel } from "./common/client.read-model";
import type { ClientRepository } from "./common/client-repository";

export type ClientOrderBy = "name" | "phone" | "email" | "id";

interface PaginationClientRequest {
	limit: number;
	cursor?: string;
	orderBy: ClientOrderBy;
	direction: SortDirection;
	search?: string;
}

export type ClientCursor = PaginationCursor<ClientOrderBy, string>;

type PaginatedClientsQuery = {
	paginationRequest: PaginationClientRequest;
	workspaceId: string;
};

interface PaginatedClientProps {
	query: PaginatedClientsQuery;
	repository: ClientRepository;
}
export const paginatedClientHandler = async ({
	query,
	repository,
}: PaginatedClientProps): Promise<Result<Pagination<ClientReadModel>>> => {
	const { paginationRequest: pagination } = query;

	const cursor = Cursor.validate<ClientCursor>(pagination);

	if (cursor.isFailure) {
		return Result.failure(cursor.error);
	}

	const clients = await repository.getAllPaginated({
		limit: pagination.limit,
		search: pagination.search,
		orderBy: pagination.orderBy,
		direction: pagination.direction,
		cursor: cursor.value ?? undefined,
		workspaceId: query.workspaceId,
	});

	return Result.success(clients);
};
