import {
	type DatabaseClient,
	type DatabaseType,
	users,
	workspaceMembers,
} from "@serviceflow/backend/shared/database";
import { and, eq } from "drizzle-orm";
import { WorkspaceMember } from "./workspace-member.model";
import type { WorkspaceMemberRepository } from "./workspace-member.repository";

export const workspaceMemberDrizzleRepository = (
	db: DatabaseClient | DatabaseType,
): WorkspaceMemberRepository => ({
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

	findMembership: async (values: {
		userId: string;
		workspaceId: string;
	}): Promise<WorkspaceMember | null> => {
		const member = await db
			.select({
				workspaceId: workspaceMembers.workspaceId,
				userId: workspaceMembers.userId,
				role: workspaceMembers.role,
				joinedAt: workspaceMembers.joinedAt,
				updatedAt: workspaceMembers.updatedAt,
			})
			.from(workspaceMembers)
			.where(
				and(
					eq(workspaceMembers.userId, values.userId),
					eq(workspaceMembers.workspaceId, values.workspaceId),
				),
			)
			.get();

		if (!member) return null;
		return WorkspaceMember.reconstitute(member);
	},

	update: async (member: WorkspaceMember): Promise<void> => {
		await db
			.update(workspaceMembers)
			.set({
				role: member.role,
				updatedAt: member.updatedAt,
			})
			.where(
				and(
					eq(workspaceMembers.userId, member.userId),
					eq(workspaceMembers.workspaceId, member.workspaceId),
				),
			);
	},
});
