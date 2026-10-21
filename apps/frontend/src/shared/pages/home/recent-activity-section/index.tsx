import { useParams, useRouteContext } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useGetRecentActivities } from "@/features/activity/recent-activities";
import { RecentActivityCard } from "./recent-activity-card";
import { RecentActivityEmptyState } from "./recent-activity-empty-state";
import { RecentActivityErrorState } from "./recent-activity-error-state";
import { RecentActivitySectionSkeleton } from "./recent-activity-section-skeleton";
import { RecentActivityTimeline } from "./recent-activity-timeline";

const HOME_ROUTE = "/_authenticated/workspace/$workspaceId/" as const;

interface RecentActivitySectionProps {
	/**
	 * Contenido a mostrar cuando no hay movimientos (p. ej. el onboarding del
	 * espacio en la home vacía). Si no se pasa, se usa la tarjeta de actividad
	 * vacía por defecto.
	 */
	emptyState?: ReactNode;
}

export function RecentActivitySection({
	emptyState,
}: RecentActivitySectionProps) {
	const { eden } = useRouteContext({ from: HOME_ROUTE });
	const { workspaceId } = useParams({ from: HOME_ROUTE });

	const { data, isPending, isError, isFetching, refetch } =
		useGetRecentActivities(eden, { workspaceId });

	if (isPending) {
		return <RecentActivitySectionSkeleton />;
	}

	if (isError) {
		return (
			<RecentActivityCard>
				<RecentActivityErrorState
					onRetry={() => void refetch()}
					isRetrying={isFetching}
				/>
			</RecentActivityCard>
		);
	}

	if (data.length === 0) {
		return (
			emptyState ?? (
				<RecentActivityCard>
					<RecentActivityEmptyState />
				</RecentActivityCard>
			)
		);
	}

	return (
		<RecentActivityCard>
			<RecentActivityTimeline activities={data} />
		</RecentActivityCard>
	);
}
