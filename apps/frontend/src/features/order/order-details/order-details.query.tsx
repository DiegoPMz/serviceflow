import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import type { Eden } from "@/shared/http/client";
import { normalizeEdenError } from "@/shared/lib/normalize-eden-error";
import type { OrderDetails } from "./order-details.types";

interface Props {
	workspaceId: string;
	orderId: string;
}

export function orderDetailsQueryKey(workspaceId: string, orderId: string) {
	return ["order-details", workspaceId, orderId] as const;
}

export function getOrderDetailsQueryOptions(eden: Eden, props: Props) {
	return queryOptions({
		queryKey: orderDetailsQueryKey(props.workspaceId, props.orderId),
		queryFn: async (): Promise<OrderDetails> => {
			const { data, error } = await eden.v1
				.workspaces({ workspaceId: props.workspaceId })
				.orders({ orderId: props.orderId })
				.get();

			if (error) {
				normalizeEdenError(error);
			}

			return data;
		},
		staleTime: 5 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
	});
}

export function useGetOrderDetails(eden: Eden, props: Props) {
	return useSuspenseQuery(getOrderDetailsQueryOptions(eden, props));
}
