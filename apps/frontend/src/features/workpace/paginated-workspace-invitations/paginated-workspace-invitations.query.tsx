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
	orderBy?: "createdAt";
	direction?: "asc" | "desc";
	/**
	 * Solo owner/admin pueden listar invitaciones. Pasa el permiso real del
	 * usuario para evitar un 403 del backend cuando no corresponda.
	 */
	enabled?: boolean;
}

export const paginatedWorkspaceInvitationsInfiniteQueryOptions = (
	eden: Eden,
	{
		workspaceId,
		limit = 20,
		orderBy = "createdAt",
		direction = "desc",
		enabled = true,
	}: Props,
) =>
	infiniteQueryOptions({
		queryKey: [
			"workspace-invitations",
			"paginated",
			workspaceId,
			{ limit, orderBy, direction },
		],
		queryFn: async ({ pageParam }) => {
			const { data, error } = await eden.v1
				.workspaces({ workspaceId })
				.invitations.get({
					query: {
						limit,
						cursor: pageParam,
						orderBy: orderBy as unknown as undefined,
						direction,
					},
				});

			if (error) normalizeEdenError(error);
			return data;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) =>
			lastPage.hasNextPage ? lastPage.cursor : undefined,
		placeholderData: keepPreviousData,
		enabled,
		staleTime: 20 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
	});

export function useGetPaginatedWorkspaceInvitations(eden: Eden, props: Props) {
	return useInfiniteQuery(
		paginatedWorkspaceInvitationsInfiniteQueryOptions(eden, props),
	);
}
