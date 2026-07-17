import {
	type DatabaseClient,
	workspaceMembers,
	workspaces,
} from "@serviceflow/backend/shared/database";
import { and, eq } from "drizzle-orm";
import { Workspace } from "./workspace.model";
import type { WorkspaceRepository } from "./workspace-repository";

export const workspaceDrizzleRepository = (
	db: DatabaseClient,
): WorkspaceRepository => ({
	save: async (model: Workspace): Promise<void> => {
		await db.insert(workspaces).values({
			id: model.id,
			name: model.name,
			prefix: model.prefix,
			orderCount: model.orderCount,
			createdAt: model.createdAt,
			updatedAt: model.updatedAt,
		});

		await db.insert(workspaceMembers).values({
			userId: model.ownerId,
			role: "owner",
			workspaceId: model.id,
		});
	},

	update: async (model: Workspace): Promise<void> => {
		await db
			.update(workspaces)
			.set({ orderCount: model.orderCount, name: model.name })
			.where(eq(workspaces.id, model.id));
	},

	getById: async (workspaceId: string): Promise<Workspace | null> => {
		const [workspace] = await db
			.select({
				id: workspaces.id,
				name: workspaces.name,
				createdAt: workspaces.createdAt,
				updatedAt: workspaces.updatedAt,
				orderCount: workspaces.orderCount,
				prefix: workspaces.prefix,
				ownerId: workspaceMembers.userId,
			})
			.from(workspaces)
			.innerJoin(
				workspaceMembers,
				eq(workspaceMembers.workspaceId, workspaces.id),
			)
			.where(
				and(eq(workspaces.id, workspaceId), eq(workspaceMembers.role, "owner")),
			);

		if (!workspace) return null;

		return Workspace.reconstitute({
			id: workspace.id,
			name: workspace.name,
			createdAt: workspace.createdAt,
			updatedAt: workspace.updatedAt,
			orderCount: workspace.orderCount,
			prefix: workspace.prefix,
			ownerId: workspace.ownerId,
		});
	},
});
