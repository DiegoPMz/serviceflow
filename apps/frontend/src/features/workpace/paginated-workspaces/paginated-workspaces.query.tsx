import {
	infiniteQueryOptions,
	useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import type { Eden } from "@/shared/http/client";
import { normalizeEdenError } from "@/shared/lib/normalize-eden-error";

interface Props {
	limit?: number;
	orderBy?: "updatedAt" | "name" | "id";
	direction?: "asc" | "desc";
	search?: string;
	cursor?: string;
}

export const paginatedWorkspacesInfiniteQueryOptions = ({
	limit = 10,
	orderBy = "updatedAt",
	direction = "asc",
	search,
	eden,
}: Props & { eden: Eden }) =>
	infiniteQueryOptions({
		queryKey: [
			"workspaces",
			"paginated",
			{ limit, orderBy, direction, search },
		],
		queryFn: async ({ pageParam }) => {
			const { data, error } = await eden.v1.workspaces.get({
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
		staleTime: "static",
	});

export function useGetPaginatedWorkspaces(eden: Eden, props?: Props) {
	return useSuspenseInfiniteQuery(
		paginatedWorkspacesInfiniteQueryOptions({ ...props, eden }),
	);
}
