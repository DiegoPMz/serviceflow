import {
	infiniteQueryOptions,
	keepPreviousData,
	useInfiniteQuery,
} from "@tanstack/react-query";
import type { Eden } from "@/shared/http/client";
import { normalizeEdenError } from "@/shared/lib/normalize-eden-error";

interface Props {
	workspaceId: string;
	limit?: number;
	orderBy?: "joinedAt" | "name" | "email";
	direction?: "asc" | "desc";
	search?: string;
}

export const paginatedWorkspaceMembersInfiniteQueryOptions = (
	eden: Eden,
	{
		workspaceId,
		limit = 10,
		orderBy = "joinedAt",
		direction = "desc",
		search,
	}: Props,
) =>
	infiniteQueryOptions({
		queryKey: [
			"workspace-members",
			"paginated",
			workspaceId,
			{ limit, orderBy, direction, search },
		],
		queryFn: async ({ pageParam }) => {
			const { data, error } = await eden.v1
				.workspaces({ workspaceId })
				.members.get({
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
		staleTime: "static",
		gcTime: 30 * 60 * 1000,
	});

export function useGetPaginatedWorkspaceMembers(eden: Eden, props: Props) {
	return useInfiniteQuery(
		paginatedWorkspaceMembersInfiniteQueryOptions(eden, props),
	);
}
