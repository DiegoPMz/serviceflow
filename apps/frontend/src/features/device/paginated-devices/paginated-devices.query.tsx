import {
	infiniteQueryOptions,
	keepPreviousData,
	useInfiniteQuery,
} from "@tanstack/react-query";
import type { Eden } from "@/shared/http/client";
import { normalizeEdenError } from "@/shared/lib/normalize-eden-error";

interface Props {
	workspaceId: string;
	limit: number;
	orderBy: "id" | "brand" | "model" | "serialNumber" | "clientId";
	direction: "asc" | "desc";
	clientId: string;
	search?: string;
	enabled?: boolean;
}

export const paginatedDevicesInfiniteQueryOptions = (
	eden: Eden,
	{ workspaceId, limit, orderBy, direction, search, clientId, enabled }: Props,
) =>
	infiniteQueryOptions({
		queryKey: [
			"devices",
			"paginated",
			workspaceId,
			{ limit, orderBy, direction, search, clientId },
		],
		queryFn: async ({ pageParam }) => {
			const { data, error } = await eden.v1
				.workspaces({ workspaceId })
				.devices.get({
					query: {
						limit,
						cursor: pageParam,
						orderBy: orderBy as unknown as undefined,
						direction,
						search,
						clientId,
					},
				});

			if (error) normalizeEdenError(error);
			return data;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) =>
			lastPage.hasNextPage ? lastPage.cursor : undefined,
		enabled: enabled ?? true,
		placeholderData: keepPreviousData,
		staleTime: 20 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
	});

export function useGetPaginatedDevices(eden: Eden, props: Props) {
	return useInfiniteQuery(paginatedDevicesInfiniteQueryOptions(eden, props));
}
