import { ulid } from "ulidx";
import type { DatabaseClient, DatabaseType } from "../client";
import { type WorkspaceRole, workspaceMembers, workspaces } from "../schema";

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
		companyLogoUrl: null,
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
