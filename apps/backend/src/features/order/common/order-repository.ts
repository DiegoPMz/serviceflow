import type { Order, OrderStatus } from "./order.model";
import type { OrderSummaryReadModel } from "./order-summary.read-model";

export interface OrderRepository {
	save: (model: Order) => Promise<void>;
	getById: (id: string) => Promise<Order | null>;
	update: (model: Order) => Promise<void>;
	updateStatus: (model: Order) => Promise<void>;

	offsetPagination: (
		params: OrderPaginationParams,
	) => Promise<OffsetPagination<OrderSummaryReadModel>>;
}

export interface OrderPaginationParams {
	page: number;
	pageSize: number;
	search?: string;
	status?: OrderStatus;
	orderBy?: "status";
	direction?: "asc" | "desc";
	workspaceId: string;
}

export interface OffsetPagination<E> {
	items: E[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}
