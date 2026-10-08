import { describe, expect, test } from "bun:test";
import type { DatabaseClient } from "@serviceflow/backend/shared/database";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import {
	addMember,
	seedWorkspace,
} from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import type { PublicAssetStorage } from "@serviceflow/backend/shared/object-storage/storage-service";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { ulid } from "ulidx";
import { workspaceErrors } from "./common/workspace.errors";
import { getWorkspaceSummaryHandler } from "./get-workspace-summary";

const publicAssetStorageStub: PublicAssetStorage = {
	getPublicUrl: (key) => `https://cdn.tecnofix.test/${key}`,
	getFileBase64: async () => "",
	fileExists: async () => false,
	createUploadPresignedUrl: async () => "",
};

const buildHandler = (
	tx: DatabaseClient,
	query: { userId: string; workspaceId: string },
) =>
	getWorkspaceSummaryHandler({
		query,
		db: tx,
		publicAssetStorage: publicAssetStorageStub,
	});

describe("Get-Workspace-Summary Integration Tests", () => {
	test("Should return the workspace summary with logoUrl", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx, {
				name: "Taller Central",
				companyLogoKey: "logos/tallercentral.png",
			});
			await addMember(tx, { userId, workspaceId, role: "admin" });

			const result = await buildHandler(tx, { userId, workspaceId });

			expect(result.isSuccess).toBe(true);
			expect(result.value).toEqual({
				id: workspaceId,
				name: "Taller Central",
				logoUrl: "https://cdn.tecnofix.test/logos/tallercentral.png",
				userRole: "admin",
				orderCount: 0,
			});
		});
	});

	test("Should return logoUrl as null when the workspace has no logo", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });

			const result = await buildHandler(tx, { userId, workspaceId });

			expect(result.isSuccess).toBe(true);
			expect(result.value?.logoUrl).toBeNull();
		});
	});

	for (const role of ["owner", "admin", "technician", "viewer"] as const) {
		test(`Should return the ${role} role from the member row`, async () => {
			await runTestInTransaction(async (tx) => {
				const userId = await seedUser(tx);
				const workspaceId = await seedWorkspace(tx);
				await addMember(tx, { userId, workspaceId, role });

				const result = await buildHandler(tx, { userId, workspaceId });

				expect(result.isSuccess).toBe(true);
				expect(result.value?.userRole).toBe(role);
			});
		});
	}

	test("Should return WORKSPACE_NOT_FOUND when the user is not a member", async () => {
		await runTestInTransaction(async (tx) => {
			const memberId = await seedUser(tx);
			const otherUserId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId: memberId, workspaceId });

			const result = await buildHandler(tx, {
				userId: otherUserId,
				workspaceId,
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(workspaceErrors.WORKSPACE_NOT_FOUND.code);
		});
	});

	test("Should return WORKSPACE_NOT_FOUND when the workspace does not exist", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			const result = await buildHandler(tx, { userId, workspaceId: ulid() });

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(workspaceErrors.WORKSPACE_NOT_FOUND.code);
		});
	});
});
