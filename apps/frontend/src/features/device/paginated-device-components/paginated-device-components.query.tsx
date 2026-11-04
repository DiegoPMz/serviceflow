import {
	infiniteQueryOptions,
	keepPreviousData,
	useInfiniteQuery,
} from "@tanstack/react-query";
import type { Eden } from "@/shared/http/client";
import { normalizeEdenError } from "@/shared/lib/normalize-eden-error";

interface Props {
	workspaceId: string;
	deviceId: string;
	limit: number;
	orderBy: "id" | "name" | "partNumber" | "type" | "createdAt";
	direction: "asc" | "desc";
	search?: string;
	enabled?: boolean;
}

export const paginatedDeviceComponentsInfiniteQueryOptions = (
	eden: Eden,
	{ workspaceId, deviceId, limit, orderBy, direction, search, enabled }: Props,
) =>
	infiniteQueryOptions({
		queryKey: [
			"device-components",
			"paginated",
			workspaceId,
			deviceId,
			{ limit, orderBy, direction, search },
		],
		queryFn: async ({ pageParam }) => {
			const { data, error } = await eden.v1
				.workspaces({ workspaceId })
				.devices({ deviceId })
				.components.get({
					query: {
						limit,
						cursor: pageParam,
						orderBy: orderBy as unknown as undefined,
						direction,
						search,
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

export function useGetPaginatedDeviceComponents(eden: Eden, props: Props) {
	return useInfiniteQuery(
		paginatedDeviceComponentsInfiniteQueryOptions(eden, props),
	);
}
