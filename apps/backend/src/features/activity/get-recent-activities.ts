import { Result } from "@serviceflow/backend/shared/result";
import { ActivityErrors } from "./common/activity.errors";
import type { ActivityReadModel } from "./common/activity.read-model";
import type { WorkspaceActivityRepository } from "./common/activity-repository";

export const ACTIVITIES_DEFAULT_LIMIT = 4;
export const ACTIVITIES_MAX_LIMIT = 50;

interface GetRecentActivitiesQuery {
	workspaceId: string;
	limit: number;
}

interface GetRecentActivitiesHandlerProps {
	query: GetRecentActivitiesQuery;
	repository: WorkspaceActivityRepository;
}

export const getRecentActivitiesHandler = async ({
	query,
	repository,
}: GetRecentActivitiesHandlerProps): Promise<Result<ActivityReadModel[]>> => {
	if (
		!Number.isInteger(query.limit) ||
		query.limit < 1 ||
		query.limit > ACTIVITIES_MAX_LIMIT
	) {
		return Result.failure(ActivityErrors.ACTIVITY_LIMIT_OUT_OF_RANGE);
	}

	const activities = await repository.getRecentByWorkspace({
		workspaceId: query.workspaceId,
		limit: query.limit,
	});

	return Result.success(activities);
};
