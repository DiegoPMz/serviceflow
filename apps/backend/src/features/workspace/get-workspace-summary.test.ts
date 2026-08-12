import { describe, expect, test } from "bun:test";
import type { DatabaseClient } from "@serviceflow/backend/shared/database";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import {
	addMember,
	seedWorkspace,
} from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { ulid } from "ulidx";
import { workspaceMemberErrors } from "./common/workspace-member.errors";
import { getWorkspaceSummaryHandler } from "./get-workspace-summary";

const buildHandler = (
	tx: DatabaseClient,
	query: { userId: string; workspaceId: string },
) => getWorkspaceSummaryHandler({ query, db: tx });

describe("Get-Workspace-Summary Integration Tests", () => {
	test("Should return the workspace summary with all company data", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const updatedAt = new Date("2024-05-01T12:00:00.000Z");
			const workspaceId = await seedWorkspace(tx, {
				name: "Taller Central",
				companyName: "TecnoFix S.A.",
				companyPhone: "+5215512345678",
				companyEmail: "contacto@tecnofix.com",
				companyAddress: "Av. Insurgentes 1234",
				companyLogoKey: "logos/tallercentral.png",
				updatedAt,
			});
			await addMember(tx, { userId, workspaceId, role: "admin" });

			const result = await buildHandler(tx, { userId, workspaceId });

			expect(result.isSuccess).toBe(true);
			expect(result.value).toEqual({
				id: workspaceId,
				name: "Taller Central",
				updatedAt,
				company: {
					name: "TecnoFix S.A.",
					phone: "+5215512345678",
					email: "contacto@tecnofix.com",
					address: "Av. Insurgentes 1234",
					logoKey: "logos/tallercentral.png",
				},
				userRole: "admin",
			});
		});
	});

	test("Should return companyLogoKey as null when the workspace has no logo", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });

			const result = await buildHandler(tx, { userId, workspaceId });

			expect(result.isSuccess).toBe(true);
			expect(result.value?.company.logoKey).toBeNull();
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

	test("Should return NOT_A_MEMBER when the user is not a member", async () => {
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
			expect(result.error.code).toBe(workspaceMemberErrors.NOT_A_MEMBER.code);
		});
	});

	test("Should return NOT_A_MEMBER when the workspace does not exist", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			const result = await buildHandler(tx, { userId, workspaceId: ulid() });

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(workspaceMemberErrors.NOT_A_MEMBER.code);
		});
	});
});
