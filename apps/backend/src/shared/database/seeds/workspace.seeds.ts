import type { InvitationRole } from "@serviceflow/backend/features/workspace/common/workspace-invitation.model";
import { WorkspaceInvitation } from "@serviceflow/backend/features/workspace/common/workspace-invitation.model";
import { workspaceInvitationDrizzleRepository } from "@serviceflow/backend/features/workspace/common/workspace-invitation-drizzle-repository";
import type { WorkspaceRole } from "@serviceflow/backend/features/workspace/common/workspace-member.model";
import { nanoid } from "nanoid";
import { ulid } from "ulidx";
import type { DatabaseClient, DatabaseType } from "../client";
import { workspaceMembers, workspaces } from "../schema";

export const seedWorkspace = async (
	db: DatabaseType | DatabaseClient,
	overrides?: Partial<typeof workspaces.$inferInsert>,
) => {
	const now = new Date();

	const workspaceId = ulid();

	const workspace = {
		id: workspaceId,
		name: "Test workspace",
		prefix: `WS-${workspaceId.slice(-4)}`,
		orderCount: 0,
		companyName: "Test Company",
		companyPhone: "+1234567890",
		companyEmail: "company@test.com",
		companyAddress: "123 Test Street",
		companyLogoKey: null,
		createdAt: now,
		updatedAt: now,
		...overrides,
	};

	await db.insert(workspaces).values(workspace);

	return workspace.id;
};

export const addMember = async (
	db: DatabaseType | DatabaseClient,
	opts: {
		userId: string;
		workspaceId: string;
		role?: WorkspaceRole;
	},
) => {
	await db.insert(workspaceMembers).values({
		userId: opts.userId,
		workspaceId: opts.workspaceId,
		role: opts.role ?? "owner",
	});
};

export const seedWorkspaceInvitation = async (
	db: DatabaseType | DatabaseClient,
	opts: {
		workspaceId: string;
		email: string;
		role?: InvitationRole;
		expirationDays?: number;
		emailId?: string;
	},
): Promise<WorkspaceInvitation> => {
	const result = WorkspaceInvitation.create({
		workspaceId: opts.workspaceId,
		email: opts.email,
		role: opts.role ?? "viewer",
		...(opts.expirationDays !== undefined
			? { expirationDays: opts.expirationDays }
			: {}),
		...(opts.emailId !== undefined ? { emailId: opts.emailId } : {}),
	});

	if (result.isFailure) {
		throw new Error(result.error.code);
	}

	await workspaceInvitationDrizzleRepository(db).save(result.value);
	return result.value;
};

export const seedExpiredWorkspaceInvitation = async (
	db: DatabaseType | DatabaseClient,
	opts: {
		workspaceId: string;
		email: string;
	},
): Promise<WorkspaceInvitation> => {
	const invitation = WorkspaceInvitation.reconstitute({
		token: nanoid(21),
		workspaceId: opts.workspaceId,
		role: "viewer",
		email: opts.email,
		expiresAt: new Date(Date.now() - 1000),
		createdAt: new Date(),
		expirationDays: 1,
		emailId: null,
		status: "pending",
		acceptedAt: null,
		cancelledAt: null,
		rejectedAt: null,
	});

	await workspaceInvitationDrizzleRepository(db).save(invitation);
	return invitation;
};
