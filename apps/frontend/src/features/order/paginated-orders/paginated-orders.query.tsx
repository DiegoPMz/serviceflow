import type { PaginationOrderRequest } from "@serviceflow/backend/features/order/paginated-orders";
import {
	keepPreviousData,
	queryOptions,
	useQuery,
} from "@tanstack/react-query";
import type { Eden } from "@/shared/http/client";
import type { PaginatedOrders } from "./paginated-orders.types";

export function getPaginatedOrdersQueryOptions(
	eden: Eden,
	props: PaginationOrderRequest & { workspaceId: string },
) {
	return queryOptions({
		queryKey: [
			"orders",
			props.workspaceId,
			props.page,
			props.pageSize,
			props.search,
			props.status,
			props.direction,
		],
		queryFn: async (): Promise<PaginatedOrders> => {
			const { data, error } = await eden.v1
				.workspaces({ workspaceId: props.workspaceId })
				.orders.get({
					query: {
						page: props.page,
						pageSize: props.pageSize,
						direction: props.direction,
						search: props.search,
						status: props.status,
					},
				});

			if (error) {
				throw error;
			}

			return data;
		},
		placeholderData: keepPreviousData,
		staleTime: "static",
	});
}

export function useGetPaginatedOrders(
	eden: Eden,
	props: PaginationOrderRequest & { workspaceId: string },
) {
	return useQuery(getPaginatedOrdersQueryOptions(eden, props));
}
