import type {
	ActivityMetadata,
	ActivityType,
} from "@serviceflow/backend/features/activity/common/activity.model";
import { ulid } from "ulidx";
import type { DatabaseClient, DatabaseType } from "../client";
import { workspaceActivities } from "../schema";

export interface SeedActivityOptions {
	workspaceId: string;
	actorUserId?: string;
	actorName?: string;
	type?: ActivityType;
	entityId?: string | null;
	entityLabel?: string;
	metadata?: ActivityMetadata | null;
	createdAt?: Date;
}

export const seedActivity = async (
	db: DatabaseClient | DatabaseType,
	opts: SeedActivityOptions,
): Promise<string> => {
	const id = ulid();

	await db.insert(workspaceActivities).values({
		id,
		workspaceId: opts.workspaceId,
		actorUserId: opts.actorUserId ?? ulid(),
		actorNameSnapshot: opts.actorName ?? "Test User",
		type: opts.type ?? "ORDER_CREATED",
		entityId: opts.entityId ?? null,
		entityLabel: opts.entityLabel ?? "OS-1001",
		metadata: opts.metadata ?? null,
		createdAt: opts.createdAt ?? new Date(),
	});

	return id;
};
