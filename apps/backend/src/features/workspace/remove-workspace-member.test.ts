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
import {
	type RemoveWorkspaceMemberCommand,
	removeWorkspaceMemberHandler,
} from "./remove-workspace-member";

const buildHandler = (
	tx: DatabaseClient,
	command: RemoveWorkspaceMemberCommand,
) =>
	removeWorkspaceMemberHandler({
		command,
		workspaceMemberRepository: workspaceMemberDrizzleRepository(tx),
	});

const isMember = async (
	tx: DatabaseClient,
	workspaceId: string,
	userId: string,
) => {
	const member = await tx
		.select({ userId: workspaceMembers.userId })
		.from(workspaceMembers)
		.where(
			and(
				eq(workspaceMembers.workspaceId, workspaceId),
				eq(workspaceMembers.userId, userId),
			),
		)
		.get();

	return member !== undefined;
};

describe("Remove-Workspace-Member Integration Tests", () => {
	test("Should remove a member and persist the change", async () => {
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
				requesterUserId: requesterId,
				targetUserId,
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.memberId).toBe(targetUserId);
			expect(await isMember(tx, workspaceId, targetUserId)).toBe(false);
		});
	});

	test("Should remove a member of another workspace without affecting the other membership", async () => {
		await runTestInTransaction(async (tx) => {
			const requesterId = await seedUser(tx);
			const targetUserId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			const otherWorkspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId: requesterId, workspaceId, role: "admin" });
			await addMember(tx, {
				userId: targetUserId,
				workspaceId,
				role: "viewer",
			});
			await addMember(tx, {
				userId: targetUserId,
				workspaceId: otherWorkspaceId,
				role: "viewer",
			});

			const result = await buildHandler(tx, {
				workspaceId,
				requesterUserId: requesterId,
				targetUserId,
			});

			expect(result.isSuccess).toBe(true);
			expect(await isMember(tx, workspaceId, targetUserId)).toBe(false);
			expect(await isMember(tx, otherWorkspaceId, targetUserId)).toBe(true);
		});
	});

	test("Should return NOT_A_MEMBER when the target user is not a member", async () => {
		await runTestInTransaction(async (tx) => {
			const requesterId = await seedUser(tx);
			const targetUserId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId: requesterId, workspaceId, role: "admin" });

			const result = await buildHandler(tx, {
				workspaceId,
				requesterUserId: requesterId,
				targetUserId,
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("NOT_A_MEMBER");
		});
	});

	test("Should return NOT_A_MEMBER when the workspace does not exist", async () => {
		await runTestInTransaction(async (tx) => {
			const requesterId = await seedUser(tx);
			const targetUserId = await seedUser(tx);

			const result = await buildHandler(tx, {
				workspaceId: ulid(),
				requesterUserId: requesterId,
				targetUserId,
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("NOT_A_MEMBER");
		});
	});

	test("Should return CANNOT_REMOVE_OWNER when trying to remove the owner", async () => {
		await runTestInTransaction(async (tx) => {
			const requesterId = await seedUser(tx);
			const ownerId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId: requesterId, workspaceId, role: "admin" });
			await addMember(tx, { userId: ownerId, workspaceId, role: "owner" });

			const result = await buildHandler(tx, {
				workspaceId,
				requesterUserId: requesterId,
				targetUserId: ownerId,
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("CANNOT_REMOVE_OWNER");
			expect(await isMember(tx, workspaceId, ownerId)).toBe(true);
		});
	});

	test("Should return CANNOT_REMOVE_SELF when the requester removes themselves", async () => {
		await runTestInTransaction(async (tx) => {
			const requesterId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId: requesterId, workspaceId, role: "admin" });

			const result = await buildHandler(tx, {
				workspaceId,
				requesterUserId: requesterId,
				targetUserId: requesterId,
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("CANNOT_REMOVE_SELF");
			expect(await isMember(tx, workspaceId, requesterId)).toBe(true);
		});
	});

	test("Should return ONLY_OWNER_CAN_REMOVE_ADMIN when an admin tries to remove another admin", async () => {
		await runTestInTransaction(async (tx) => {
			const requesterId = await seedUser(tx);
			const targetUserId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId: requesterId, workspaceId, role: "admin" });
			await addMember(tx, { userId: targetUserId, workspaceId, role: "admin" });

			const result = await buildHandler(tx, {
				workspaceId,
				requesterUserId: requesterId,
				targetUserId,
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("ONLY_OWNER_CAN_REMOVE_ADMIN");
			expect(await isMember(tx, workspaceId, targetUserId)).toBe(true);
		});
	});

	test("Should allow the owner to remove an admin", async () => {
		await runTestInTransaction(async (tx) => {
			const ownerId = await seedUser(tx);
			const targetUserId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId: ownerId, workspaceId, role: "owner" });
			await addMember(tx, { userId: targetUserId, workspaceId, role: "admin" });

			const result = await buildHandler(tx, {
				workspaceId,
				requesterUserId: ownerId,
				targetUserId,
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.memberId).toBe(targetUserId);
			expect(await isMember(tx, workspaceId, targetUserId)).toBe(false);
		});
	});

	test("Should allow an admin to remove a technician", async () => {
		await runTestInTransaction(async (tx) => {
			const requesterId = await seedUser(tx);
			const targetUserId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId: requesterId, workspaceId, role: "admin" });
			await addMember(tx, {
				userId: targetUserId,
				workspaceId,
				role: "technician",
			});

			const result = await buildHandler(tx, {
				workspaceId,
				requesterUserId: requesterId,
				targetUserId,
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.memberId).toBe(targetUserId);
			expect(await isMember(tx, workspaceId, targetUserId)).toBe(false);
		});
	});
});
