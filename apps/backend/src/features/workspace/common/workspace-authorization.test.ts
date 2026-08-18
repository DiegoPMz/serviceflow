import { describe, expect, test } from "bun:test";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import {
	addMember,
	seedWorkspace,
} from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { ulid } from "ulidx";
import { workspaceAuthorization } from "./workspace-authorization";
import { workspaceMemberDrizzleRepository } from "./workspace-drizzle-member-repository";
import { workspaceMemberErrors } from "./workspace-member.errors";

describe("Workspace-WorkspaceAuthorization Integration Tests", () => {
	test("Should return success when the user has an allowed role", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId, role: "owner" });

			const result = await workspaceAuthorization({
				membersRepository: workspaceMemberDrizzleRepository(tx),
			}).excecute({
				userId,
				workspaceId,
				requiredRoles: ["owner", "admin"],
			});

			expect(result.isSuccess).toBeTrue();
			expect(result.value).toBeDefined();
		});
	});

	test("Should return authorization with a WorkspaceMember model", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId, role: "admin" });

			const result = await workspaceAuthorization({
				membersRepository: workspaceMemberDrizzleRepository(tx),
			}).excecute({
				userId,
				workspaceId,
				requiredRoles: ["owner", "admin"],
			});

			expect(result.isSuccess).toBeTrue();
			expect(result.value).toMatchObject({
				workspaceId: workspaceId,
				userId: userId,
				role: "admin",
			});
		});
	});

	test("Should allow a viewer role when required", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId, role: "viewer" });

			const result = await workspaceAuthorization({
				membersRepository: workspaceMemberDrizzleRepository(tx),
			}).excecute({
				userId,
				workspaceId,
				requiredRoles: ["viewer"],
			});

			expect(result.isSuccess).toBeTrue();
			expect(result.value).toMatchObject({
				workspaceId: workspaceId,
				userId: userId,
				role: "viewer",
			});
		});
	});

	test("Should fail with NOT_A_MEMBER even if the user is a member of another workspace", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const otherWorkspace = await seedWorkspace(tx);
			const targetWorkspace = await seedWorkspace(tx);
			await addMember(tx, {
				userId,
				workspaceId: otherWorkspace,
				role: "owner",
			});

			const result = await workspaceAuthorization({
				membersRepository: workspaceMemberDrizzleRepository(tx),
			}).excecute({
				userId,
				workspaceId: targetWorkspace,
				requiredRoles: ["owner"],
			});

			expect(result.isFailure).toBeTrue();
			expect(result.error.code).toBe(workspaceMemberErrors.NOT_A_MEMBER.code);
		});
	});

	test("Should fail with NOT_A_MEMBER when the user is not a member", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);

			const result = await workspaceAuthorization({
				membersRepository: workspaceMemberDrizzleRepository(tx),
			}).excecute({
				userId,
				workspaceId,
				requiredRoles: ["owner"],
			});

			expect(result.isFailure).toBeTrue();
			expect(result.error.code).toBe(workspaceMemberErrors.NOT_A_MEMBER.code);
		});
	});

	test("Should fail with NOT_A_MEMBER when the workspace does not exist", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			const result = await workspaceAuthorization({
				membersRepository: workspaceMemberDrizzleRepository(tx),
			}).excecute({
				userId,
				workspaceId: ulid(),
				requiredRoles: ["owner"],
			});

			expect(result.isFailure).toBeTrue();
			expect(result.error.code).toBe(workspaceMemberErrors.NOT_A_MEMBER.code);
		});
	});

	test("Should return INSUFFICIENT_PERMISSIONS when the role does not match", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId, role: "viewer" });

			const result = await workspaceAuthorization({
				membersRepository: workspaceMemberDrizzleRepository(tx),
			}).excecute({
				userId,
				workspaceId,
				requiredRoles: ["owner", "admin"],
			});

			expect(result.isFailure).toBeTrue();
			expect(result.error.code).toBe(
				workspaceMemberErrors.INSUFFICIENT_PERMISSIONS.code,
			);
		});
	});
});
