import {
	type DatabaseClient,
	type DatabaseType,
	users,
	workspaceMembers,
} from "@serviceflow/backend/shared/database";
import { and, eq } from "drizzle-orm";
import type { WorkspaceMember, WorkspaceRole } from "./workspace-member.model";
import type { WorkspaceMemberRepository } from "./workspace-member.repository";

export const workspaceMemberDrizzleRepository = (
	db: DatabaseClient | DatabaseType,
): WorkspaceMemberRepository => ({
	findMembership: async (values: {
		userId: string;
		workspaceId: string;
	}): Promise<WorkspaceRole[]> => {
		const userRoles = await db
			.select({
				role: workspaceMembers.role,
			})
			.from(workspaceMembers)
			.where(
				and(
					eq(workspaceMembers.userId, values.userId),
					eq(workspaceMembers.workspaceId, values.workspaceId),
				),
			);

		return userRoles.map((ur) => ur.role);
	},

	existsByEmailAndWorkspace: async (
		email: string,
		workspaceId: string,
	): Promise<boolean> => {
		const memberships = await db
			.select({ userId: workspaceMembers.userId })
			.from(workspaceMembers)
			.innerJoin(users, eq(workspaceMembers.userId, users.id))
			.where(
				and(
					eq(users.email, email),
					eq(workspaceMembers.workspaceId, workspaceId),
				),
			)
			.limit(1);

		return memberships.length > 0;
	},

	addMember: async (member: WorkspaceMember): Promise<void> => {
		await db.insert(workspaceMembers).values({
			workspaceId: member.workspaceId,
			userId: member.userId,
			role: member.role,
			joinedAt: member.joinedAt,
			updatedAt: member.updatedAt,
		});
	},
});
