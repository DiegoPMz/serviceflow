import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import type { Eden } from "@/shared/http/client";
import { ApiError } from "@/shared/lib/api-error";
import { normalizeEdenError } from "@/shared/lib/normalize-eden-error";
import type { ClientDetails } from "./client-details.types";

interface Props {
	workspaceId: string;
	clientId: string;
}

export function clientDetailsQueryKey(workspaceId: string, clientId: string) {
	return ["client-details", workspaceId, clientId] as const;
}

export function getClientDetailsQueryOptions(eden: Eden, props: Props) {
	return queryOptions({
		queryKey: clientDetailsQueryKey(props.workspaceId, props.clientId),
		queryFn: async (): Promise<ClientDetails> => {
			const { data, error } = await eden.v1
				.workspaces({ workspaceId: props.workspaceId })
				.clients({ clientId: props.clientId })
				.get();

			if (error) {
				normalizeEdenError(error);
			}

			return data;
		},
		staleTime: 5 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
		retry: (failureCount, error) => {
			if (error instanceof ApiError && error.statusCode < 500) return false;

			return failureCount < 2;
		},
	});
}

export function useGetClientDetails(eden: Eden, props: Props) {
	return useSuspenseQuery(getClientDetailsQueryOptions(eden, props));
}
