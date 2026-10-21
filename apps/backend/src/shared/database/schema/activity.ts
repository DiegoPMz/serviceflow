import type { ActivityMetadata } from "@serviceflow/backend/features/activity/common/activity.model";
import { ACTIVITY_TYPES_ARRAY } from "@serviceflow/backend/features/activity/common/activity.model";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sqliteNowEffort } from "../helpers";
import { workspaces } from "./workspace";

export const workspaceActivities = sqliteTable(
	"workspace_activities",
	{
		id: text("id", { length: 26 }).primaryKey(),

		workspaceId: text("workspace_id", { length: 26 })
			.references(() => workspaces.id, { onDelete: "cascade" })
			.notNull(),

		actorUserId: text("actor_user_id", { length: 26 }).notNull(),
		actorNameSnapshot: text("actor_name_snapshot", { length: 200 }).notNull(),

		type: text("type", { enum: ACTIVITY_TYPES_ARRAY }).notNull(),

		entityId: text("entity_id", { length: 26 }),
		entityLabel: text("entity_label", { length: 255 }).notNull(),
		metadata: text("metadata", { mode: "json" }).$type<ActivityMetadata>(),

		createdAt: integer("created_at", { mode: "timestamp" })
			.default(sqliteNowEffort)
			.notNull(),
	},
	(table) => [
		index("workspace_activities_workspace_date_idx").on(
			table.workspaceId,
			table.createdAt,
		),
	],
);
