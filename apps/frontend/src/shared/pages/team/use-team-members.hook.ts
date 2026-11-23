import { useState } from "react";
import { useGetPaginatedWorkspaceMembers } from "@/features/workpace/paginated-workspace-members";
import type { Eden } from "@/shared/http/client";
import { useDebouncedValue } from "@/shared/lib/use-debounced-value";
import type { TeamMembersState } from "./team.types";

interface UseTeamMembersInput {
	eden: Eden;
	workspaceId: string;
}

export function useTeamMembers({
	eden,
	workspaceId,
}: UseTeamMembersInput): TeamMembersState {
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search);

	const query = useGetPaginatedWorkspaceMembers(eden, {
		workspaceId,
		search: debouncedSearch.trim() || undefined,
	});

	return {
		items: (query.data?.pages ?? []).flatMap((page) => page.items),
		search,
		onSearchChange: (value) => setSearch(value),
		query: {
			isPending: query.isPending,
			isError: query.isError,
			isRefetchError: query.isRefetchError,
			isFetchNextPageError: query.isFetchNextPageError,
			hasNextPage: query.hasNextPage,
			isFetchingNextPage: query.isFetchingNextPage,
			onLoadMore: () => query.fetchNextPage(),
			refetch: () => query.refetch(),
		},
	};
}
