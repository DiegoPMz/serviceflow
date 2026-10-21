import {
	type DatabaseClient,
	type DatabaseType,
	workspaceActivities,
} from "@serviceflow/backend/shared/database";
import { desc, eq } from "drizzle-orm";
import type { WorkspaceActivity } from "./activity.model";
import { ActivityReadModel } from "./activity.read-model";
import type { WorkspaceActivityRepository } from "./activity-repository";

export const activityDrizzleRepository = (
	db: DatabaseClient | DatabaseType,
): WorkspaceActivityRepository => ({
	save: async (activity: WorkspaceActivity): Promise<void> => {
		await db.insert(workspaceActivities).values({
			id: activity.id,
			workspaceId: activity.workspaceId,
			actorUserId: activity.actorUserId,
			actorNameSnapshot: activity.actorNameSnapshot,
			type: activity.type,
			entityId: activity.entityId,
			entityLabel: activity.entityLabel,
			metadata: activity.metadata,
			createdAt: activity.createdAt,
		});
	},

	getRecentByWorkspace: async ({
		workspaceId,
		limit,
	}: {
		workspaceId: string;
		limit: number;
	}): Promise<ActivityReadModel[]> => {
		const activities = await db
			.select({
				id: workspaceActivities.id,
				type: workspaceActivities.type,
				actorNameSnapshot: workspaceActivities.actorNameSnapshot,
				entityLabel: workspaceActivities.entityLabel,
				metadata: workspaceActivities.metadata,
				createdAt: workspaceActivities.createdAt,
			})
			.from(workspaceActivities)
			.where(eq(workspaceActivities.workspaceId, workspaceId))
			.orderBy(
				desc(workspaceActivities.createdAt),
				desc(workspaceActivities.id),
			)
			.limit(limit);

		return activities.map((activity) => ActivityReadModel.create(activity));
	},
});
