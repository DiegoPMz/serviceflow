import {
	type DatabaseClient,
	type DatabaseType,
	workspaceInvitations,
} from "@serviceflow/backend/shared/database";
import { and, eq } from "drizzle-orm";
import {
	type InvitationRole,
	WorkspaceInvitation,
} from "./workspace-invitation.model";
import type { WorkspaceInvitationRepository } from "./workspace-invitation-repository";

export const workspaceInvitationDrizzleRepository = (
	db: DatabaseClient | DatabaseType,
): WorkspaceInvitationRepository => ({
	save: async (invitation: WorkspaceInvitation): Promise<void> => {
		await db.insert(workspaceInvitations).values({
			token: invitation.token,
			workspaceId: invitation.workspaceId,
			role: invitation.role,
			email: invitation.email,
			expirationDays: invitation.expirationDays,
			expiresAt: invitation.expiresAt,
			createdAt: invitation.createdAt,
		});
	},

	update: async (invitation: WorkspaceInvitation): Promise<void> => {
		await db
			.update(workspaceInvitations)
			.set({
				token: invitation.token,
				expiresAt: invitation.expiresAt,
			})
			.where(
				and(
					eq(workspaceInvitations.workspaceId, invitation.workspaceId),
					eq(workspaceInvitations.email, invitation.email),
				),
			);
	},

	findByToken: async (token: string): Promise<WorkspaceInvitation | null> => {
		const entity = await db.query.workspaceInvitations.findFirst({
			where: (invitations, { eq }) => eq(invitations.token, token),
		});

		if (!entity) return null;
		return toModel(entity);
	},

	deleteByToken: async (token: string): Promise<void> => {
		await db
			.delete(workspaceInvitations)
			.where(eq(workspaceInvitations.token, token));
	},

	findByEmailAndWorkspace: async (
		email: string,
		workspaceId: string,
	): Promise<WorkspaceInvitation | null> => {
		const entity = await db.query.workspaceInvitations.findFirst({
			where: (invitations, { and, eq }) =>
				and(
					eq(invitations.email, email.toLowerCase().trim()),
					eq(invitations.workspaceId, workspaceId),
				),
		});

		if (!entity) return null;
		return toModel(entity);
	},

	transaction: async <R>(
		fn: (txRepo: WorkspaceInvitationRepository) => Promise<R>,
	): Promise<R> => {
		return await db.transaction(async (tx) => {
			const txRepo = workspaceInvitationDrizzleRepository(tx);
			return await fn(txRepo);
		});
	},
});

const toModel = (
	entity: typeof workspaceInvitations.$inferSelect,
): WorkspaceInvitation =>
	WorkspaceInvitation.reconstitute({
		token: entity.token,
		workspaceId: entity.workspaceId,
		role: entity.role as InvitationRole,
		email: entity.email,
		expiresAt: entity.expiresAt,
		createdAt: entity.createdAt,
		expirationDays: entity.expirationDays,
	});
