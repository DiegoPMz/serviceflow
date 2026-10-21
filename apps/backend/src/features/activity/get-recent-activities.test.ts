import { describe, expect, test } from "bun:test";
import { seedActivity } from "@serviceflow/backend/shared/database/seeds/activity.seeds";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import { seedWorkspace } from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { ACTIVITY_ERROR_CODES } from "@serviceflow/error-codes";
import { activityDrizzleRepository } from "./common/activity-drizzle-repository";
import { getRecentActivitiesHandler } from "./get-recent-activities";

describe("Get-Recent-Activities Integration Tests", () => {
	test("Should return the most recent activities ordered from newest to oldest", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const actorUserId = await seedUser(tx);

			await seedActivity(tx, {
				workspaceId,
				actorUserId,
				entityLabel: "OS-000101",
				createdAt: new Date("2026-01-01T10:00:00Z"),
			});
			await seedActivity(tx, {
				workspaceId,
				actorUserId,
				entityLabel: "OS-000102",
				createdAt: new Date("2026-01-02T10:00:00Z"),
			});
			await seedActivity(tx, {
				workspaceId,
				actorUserId,
				type: "CLIENT_CREATED",
				entityLabel: "Empresa ABC",
				createdAt: new Date("2026-01-03T10:00:00Z"),
			});

			const result = await getRecentActivitiesHandler({
				query: { workspaceId, limit: 4 },
				repository: activityDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.map((activity) => activity.entityLabel)).toEqual([
				"Empresa ABC",
				"OS-000102",
				"OS-000101",
			]);
		});
	});

	test("Should respect the requested limit and keep the newest events", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const actorUserId = await seedUser(tx);

			for (let index = 0; index < 6; index += 1) {
				await seedActivity(tx, {
					workspaceId,
					actorUserId,
					entityLabel: `OS-00010${index}`,
					createdAt: new Date(`2026-02-0${index + 1}T10:00:00Z`),
				});
			}

			const result = await getRecentActivitiesHandler({
				query: { workspaceId, limit: 4 },
				repository: activityDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.length).toBe(4);
			expect(result.value[0]?.entityLabel).toBe("OS-000105");
		});
	});

	test("Should only return activities that belong to the requested workspace", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx, { name: "WORKSPACE-1" });
			const otherWorkspaceId = await seedWorkspace(tx, { name: "WORKSPACE-2" });
			const actorUserId = await seedUser(tx);

			await seedActivity(tx, {
				workspaceId,
				actorUserId,
				entityLabel: "OS-000101",
			});
			await seedActivity(tx, {
				workspaceId: otherWorkspaceId,
				actorUserId,
				entityLabel: "OS-000999",
			});

			const result = await getRecentActivitiesHandler({
				query: { workspaceId, limit: 4 },
				repository: activityDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.length).toBe(1);
			expect(result.value[0]?.entityLabel).toBe("OS-000101");
		});
	});

	test("Should return an empty list when the workspace has no activity", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			const result = await getRecentActivitiesHandler({
				query: { workspaceId, limit: 4 },
				repository: activityDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value).toEqual([]);
		});
	});

	test("Should return ACTIVITY_LIMIT_OUT_OF_RANGE when the limit is invalid", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			for (const limit of [0, -1, 51, 1.5]) {
				const result = await getRecentActivitiesHandler({
					query: { workspaceId, limit },
					repository: activityDrizzleRepository(tx),
				});

				expect(result.isFailure).toBe(true);
				expect(result.error.code).toBe(ACTIVITY_ERROR_CODES.LIMIT_OUT_OF_RANGE);
			}
		});
	});
});
