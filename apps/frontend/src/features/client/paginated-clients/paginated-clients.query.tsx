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
	orderBy: "name" | "phone" | "email" | "id";
	direction: "asc" | "desc";
	search?: string;
}

export const paginatedClientsInfiniteQueryOptions = (
	eden: Eden,
	{ workspaceId, limit, orderBy, direction, search }: Props,
) =>
	infiniteQueryOptions({
		queryKey: [
			"clients",
			"paginated",
			workspaceId,
			{ limit, orderBy, direction, search },
		],
		queryFn: async ({ pageParam }) => {
			const { data, error } = await eden.v1
				.workspaces({ workspaceId })
				.clients.get({
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
		placeholderData: keepPreviousData,
		staleTime: 20 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
	});

export function useGetPaginatedClients(eden: Eden, props: Props) {
	return useInfiniteQuery(paginatedClientsInfiniteQueryOptions(eden, props));
}
