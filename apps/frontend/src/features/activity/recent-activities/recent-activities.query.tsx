import { queryOptions, useQuery } from "@tanstack/react-query";
import type { Eden } from "@/shared/http/client";
import { normalizeEdenError } from "@/shared/lib/normalize-eden-error";
import type { RecentActivities } from "./recent-activities.types";

const RECENT_ACTIVITIES_LIMIT = 4;

interface Props {
	workspaceId: string;
}

export function recentActivitiesQueryKey(workspaceId: string) {
	return ["recent-activities", workspaceId] as const;
}

export function recentActivitiesQueryOptions(eden: Eden, props: Props) {
	return queryOptions({
		queryKey: recentActivitiesQueryKey(props.workspaceId),
		queryFn: async (): Promise<RecentActivities> => {
			if (import.meta.env.DEV) {
				await new Promise<void>((resolve) => {
					setTimeout(resolve, 1500);
				});
			}

			const { data, error } = await eden.v1
				.workspaces({ workspaceId: props.workspaceId })
				.activities.get({ query: { limit: RECENT_ACTIVITIES_LIMIT } });

			if (error) normalizeEdenError(error);
			return data;
		},
		staleTime: 20 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
	});
}

export function useGetRecentActivities(eden: Eden, props: Props) {
	return useQuery(recentActivitiesQueryOptions(eden, props));
}
