import {
	Cursor,
	type PaginationCursor,
} from "@serviceflow/backend/shared/pagination";
import type {
	Pagination,
	SortDirection,
} from "@serviceflow/backend/shared/pagination/types";
import { Result } from "@serviceflow/backend/shared/result";
import type { OrderStatus } from "./common/order.model";
import type { OrderRepository } from "./common/order-repository";
import type { OrderSummaryReadModel } from "./common/order-summary.read-model";

export type OrderOrderBy =
	| "id"
	| "folio"
	| "createdAt"
	| "updatedAt"
	| "clientName"
	| "deviceBrand"
	| "status"
	| "userName";

interface PaginationOrderRequest {
	limit: number;
	cursor?: string;
	orderBy: OrderOrderBy;
	direction: SortDirection;
	search?: string;
}

export type OrderCursor = PaginationCursor<OrderOrderBy, string | number>;

type PaginatedOrdersQuery = {
	paginationRequest: PaginationOrderRequest;
	workspaceId: string;
	status?: OrderStatus;
};

interface PaginatedOrderProps {
	query: PaginatedOrdersQuery;
	repository: OrderRepository;
}

export const paginatedOrderHandler = async ({
	query,
	repository,
}: PaginatedOrderProps): Promise<Result<Pagination<OrderSummaryReadModel>>> => {
	const { paginationRequest: pagination, status } = query;

	const cursor = Cursor.validate<OrderCursor>(pagination);

	if (cursor.isFailure) {
		return Result.failure(cursor.error);
	}

	const orders = await repository.getAllPaginated({
		limit: pagination.limit,
		search: pagination.search,
		orderBy: pagination.orderBy,
		direction: pagination.direction,
		cursor: cursor.value ?? undefined,
		workspaceId: query.workspaceId,
		status,
	});

	return Result.success(orders);
};
