import type { Pagination } from "@serviceflow/backend/shared/pagination";
import type { SortDirection } from "@serviceflow/backend/shared/pagination/types";
import type { OrderCursor, OrderOrderBy } from "../paginated-orders";
import type { Order, OrderStatus } from "./order.model";
import type { OrderSummaryReadModel } from "./order-summary.read-model";

export interface OrderRepository {
	save: (model: Order) => Promise<void>;
	getById: (id: string) => Promise<Order | null>;
	update: (model: Order) => Promise<void>;
	updateStatus: (model: Order) => Promise<void>;
	getAllPaginated(params: {
		limit: number;
		cursor?: OrderCursor;
		orderBy: OrderOrderBy;
		direction: SortDirection;
		search?: string;
		workspaceId: string;
		status?: OrderStatus;
	}): Promise<Pagination<OrderSummaryReadModel>>;
}
