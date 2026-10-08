import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import type { Eden } from "@/shared/http/client";

interface Props {
	workspaceId: string;
}

export function getWorkspaceSummaryQueryOptions(eden: Eden, props: Props) {
	return queryOptions({
		queryKey: ["workspace-summary", props.workspaceId],
		queryFn: async () => {
			const { data, error } = await eden.v1
				.workspaces({ workspaceId: props.workspaceId })
				.get();

			if (error) {
				throw error;
			}

			return data;
		},
		staleTime: "static",
	});
}

export function useGetWorkspaceSummary(eden: Eden, props: Props) {
	return useSuspenseQuery(getWorkspaceSummaryQueryOptions(eden, props));
}
