import { describe, expect, test } from "bun:test";
import type { DatabaseClient } from "@serviceflow/backend/shared/database";
import { workspaceMembers } from "@serviceflow/backend/shared/database";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import {
	addMember,
	seedWorkspace,
} from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { and, eq } from "drizzle-orm";
import { ulid } from "ulidx";
import { workspaceMemberDrizzleRepository } from "./common/workspace-drizzle-member-repository";
import type { WorkspaceRole } from "./common/workspace-member.model";
import {
	type UpdateWorkspaceMemberRoleCommand,
	updateWorkspaceMemberRoleHandler,
} from "./update-workspace-member-role";

type RoleChangeCommand = Omit<UpdateWorkspaceMemberRoleCommand, "newRole"> & {
	newRole: WorkspaceRole;
};

const buildHandler = (tx: DatabaseClient, command: RoleChangeCommand) =>
	updateWorkspaceMemberRoleHandler({
		command: command as UpdateWorkspaceMemberRoleCommand,
		workspaceMemberRepository: workspaceMemberDrizzleRepository(tx),
	});

const getMemberRole = async (
	tx: DatabaseClient,
	workspaceId: string,
	userId: string,
) => {
	const member = await tx
		.select({ role: workspaceMembers.role })
		.from(workspaceMembers)
		.where(
			and(
				eq(workspaceMembers.workspaceId, workspaceId),
				eq(workspaceMembers.userId, userId),
			),
		)
		.get();

	return member?.role;
};

describe("Update-Workspace-Member-Role Integration Tests", () => {
	test("Should update the role of a member and persist the change", async () => {
		await runTestInTransaction(async (tx) => {
			const targetUserId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, {
				userId: targetUserId,
				workspaceId,
				role: "viewer",
			});

			const result = await buildHandler(tx, {
				workspaceId,
				targetUserId,
				newRole: "admin",
			});

			expect(result.isSuccess).toBe(true);
			expect(await getMemberRole(tx, workspaceId, targetUserId)).toBe("admin");
		});
	});

	test("Should return NOT_A_MEMBER when the target user is not a member", async () => {
		await runTestInTransaction(async (tx) => {
			const targetUserId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);

			const result = await buildHandler(tx, {
				workspaceId,
				targetUserId,
				newRole: "admin",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("NOT_A_MEMBER");
		});
	});

	test("Should return CANNOT_CHANGE_OWNER_ROLE when trying to change the owner role", async () => {
		await runTestInTransaction(async (tx) => {
			const ownerId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId: ownerId, workspaceId, role: "owner" });

			const result = await buildHandler(tx, {
				workspaceId,
				targetUserId: ownerId,
				newRole: "admin",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("CANNOT_CHANGE_OWNER_ROLE");
			expect(await getMemberRole(tx, workspaceId, ownerId)).toBe("owner");
		});
	});

	test("Should return CANNOT_ASSIGN_OWNER_ROLE when trying to promote a member to owner", async () => {
		await runTestInTransaction(async (tx) => {
			const targetUserId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, {
				userId: targetUserId,
				workspaceId,
				role: "viewer",
			});

			const result = await buildHandler(tx, {
				workspaceId,
				targetUserId,
				newRole: "owner",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("CANNOT_ASSIGN_OWNER_ROLE");
			expect(await getMemberRole(tx, workspaceId, targetUserId)).toBe("viewer");
		});
	});

	test("Should be idempotent when assigning the same role", async () => {
		await runTestInTransaction(async (tx) => {
			const targetUserId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, {
				userId: targetUserId,
				workspaceId,
				role: "viewer",
			});

			const result = await buildHandler(tx, {
				workspaceId,
				targetUserId,
				newRole: "viewer",
			});

			expect(result.isSuccess).toBe(true);
			expect(await getMemberRole(tx, workspaceId, targetUserId)).toBe("viewer");
		});
	});

	test("Should be able to change the role of a member that is not the requester", async () => {
		await runTestInTransaction(async (tx) => {
			const requesterId = await seedUser(tx);
			const targetUserId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId: requesterId, workspaceId, role: "admin" });
			await addMember(tx, {
				userId: targetUserId,
				workspaceId,
				role: "viewer",
			});

			const result = await buildHandler(tx, {
				workspaceId,
				targetUserId,
				newRole: "technician",
			});

			expect(result.isSuccess).toBe(true);
			expect(await getMemberRole(tx, workspaceId, targetUserId)).toBe(
				"technician",
			);
		});
	});

	test("Should return NOT_A_MEMBER when the workspace does not exist", async () => {
		await runTestInTransaction(async (tx) => {
			const targetUserId = await seedUser(tx);
			const result = await buildHandler(tx, {
				workspaceId: ulid(),
				targetUserId,
				newRole: "admin",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("NOT_A_MEMBER");
		});
	});
});
