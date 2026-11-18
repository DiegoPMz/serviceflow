import type { PaginationOrderRequest } from "@serviceflow/backend/features/order/paginated-orders";
import {
	keepPreviousData,
	queryOptions,
	useQuery,
} from "@tanstack/react-query";
import type { Eden } from "@/shared/http/client";
import { normalizeEdenError } from "@/shared/lib/normalize-eden-error";
import type { PaginatedOrders } from "./paginated-orders.types";

export function getPaginatedOrdersQueryOptions(
	eden: Eden,
	props: PaginationOrderRequest & { workspaceId: string; enabled?: boolean },
) {
	return queryOptions({
		queryKey: [
			"orders",
			props.workspaceId,
			props.page,
			props.pageSize,
			props.search,
			props.status,
			props.deviceId,
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
						deviceId: props.deviceId,
					},
				});

			if (error) normalizeEdenError(error);
			return data;
		},
		placeholderData: keepPreviousData,
		enabled: props.enabled ?? true,
		staleTime: 20 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
	});
}

export function useGetPaginatedOrders(
	eden: Eden,
	props: PaginationOrderRequest & { workspaceId: string; enabled?: boolean },
) {
	return useQuery(getPaginatedOrdersQueryOptions(eden, props));
}
