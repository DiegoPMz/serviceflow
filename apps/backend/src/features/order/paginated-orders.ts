import { Result } from "@serviceflow/backend/shared/result";
import type { OrderStatus } from "./common/order.model";
import type {
	OffsetPagination,
	OrderRepository,
} from "./common/order-repository";
import type { OrderSummaryReadModel } from "./common/order-summary.read-model";

export interface PaginationOrderRequest {
	page: number;
	pageSize: number;
	search?: string;
	status?: OrderStatus;
	direction?: "asc" | "desc";
}

interface PaginatedOrderProps {
	query: {
		paginationRequest: PaginationOrderRequest;
		workspaceId: string;
	};
	repository: OrderRepository;
}

export const paginatedOrderHandler = async ({
	query,
	repository,
}: PaginatedOrderProps): Promise<
	Result<OffsetPagination<OrderSummaryReadModel>>
> => {
	const { paginationRequest: pagination, workspaceId } = query;

	const orders = await repository.offsetPagination({
		...pagination,
		workspaceId,
	});

	return Result.success(orders);
};
