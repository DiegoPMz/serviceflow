import { describe, expect, test } from "bun:test";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import {
	addMember,
	seedWorkspace,
} from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { ulid } from "ulidx";
import { workspaceErrors } from "./workspace.errors";
import { workspaceAuthorization } from "./workspace-authorization";
import { workspaceDrizzleRepository } from "./workspace-drizzle-repository";

describe("Workspace-WorkspaceAuthorization Integration Tests", () => {
	test("Should return success when the user has an allowed role", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId, role: "owner" });

			const result = await workspaceAuthorization({
				workspaceRepository: workspaceDrizzleRepository(tx),
			}).excecute({
				userId,
				workspaceId,
				requiredRoles: ["owner", "admin"],
			});

			expect(result.isSuccess).toBeTrue();
			expect(result.value).toContain("owner");
		});
	});

	test("Should return authorization with the granted roles", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId, role: "admin" });

			const result = await workspaceAuthorization({
				workspaceRepository: workspaceDrizzleRepository(tx),
			}).excecute({
				userId,
				workspaceId,
				requiredRoles: ["owner", "admin"],
			});

			expect(result.isSuccess).toBeTrue();
			expect(result.value).toEqual(["admin"]);
		});
	});

	test("Should allow a viewer role when required", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId, role: "viewer" });

			const result = await workspaceAuthorization({
				workspaceRepository: workspaceDrizzleRepository(tx),
			}).excecute({
				userId,
				workspaceId,
				requiredRoles: ["viewer"],
			});

			expect(result.isSuccess).toBeTrue();
			expect(result.value).toEqual(["viewer"]);
		});
	});

	test("Should scope membership to the target workspace when the user belongs to several", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceA = await seedWorkspace(tx);
			const workspaceB = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId: workspaceA, role: "owner" });
			await addMember(tx, { userId, workspaceId: workspaceB, role: "viewer" });

			const authorization = workspaceAuthorization({
				workspaceRepository: workspaceDrizzleRepository(tx),
			});

			const resultA = await authorization.excecute({
				userId,
				workspaceId: workspaceA,
				requiredRoles: ["owner"],
			});

			expect(resultA.isSuccess).toBeTrue();
			expect(resultA.value).toEqual(["owner"]);

			const resultB = await authorization.excecute({
				userId,
				workspaceId: workspaceB,
				requiredRoles: ["owner"],
			});

			expect(resultB.isFailure).toBeTrue();
			expect(resultB.error.code).toBe(
				workspaceErrors.INSUFFICIENT_PERMISSIONS.code,
			);
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
				workspaceRepository: workspaceDrizzleRepository(tx),
			}).excecute({
				userId,
				workspaceId: targetWorkspace,
				requiredRoles: ["owner"],
			});

			expect(result.isFailure).toBeTrue();
			expect(result.error.code).toBe(workspaceErrors.NOT_A_MEMBER.code);
		});
	});

	test("Should fail with NOT_A_MEMBER when the user is not a member", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);

			const result = await workspaceAuthorization({
				workspaceRepository: workspaceDrizzleRepository(tx),
			}).excecute({
				userId,
				workspaceId,
				requiredRoles: ["owner"],
			});

			expect(result.isFailure).toBeTrue();
			expect(result.error.code).toBe(workspaceErrors.NOT_A_MEMBER.code);
		});
	});

	test("Should fail with NOT_A_MEMBER when the workspace does not exist", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			const result = await workspaceAuthorization({
				workspaceRepository: workspaceDrizzleRepository(tx),
			}).excecute({
				userId,
				workspaceId: ulid(),
				requiredRoles: ["owner"],
			});

			expect(result.isFailure).toBeTrue();
			expect(result.error.code).toBe(workspaceErrors.NOT_A_MEMBER.code);
		});
	});

	test("Should return INSUFFICIENT_PERMISSIONS when the role does not match", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId, role: "viewer" });

			const result = await workspaceAuthorization({
				workspaceRepository: workspaceDrizzleRepository(tx),
			}).excecute({
				userId,
				workspaceId,
				requiredRoles: ["owner", "admin"],
			});

			expect(result.isFailure).toBeTrue();
			expect(result.error.code).toBe(
				workspaceErrors.INSUFFICIENT_PERMISSIONS.code,
			);
		});
	});
});
