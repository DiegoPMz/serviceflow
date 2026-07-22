import { describe, expect, test } from "bun:test";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import {
	addMember,
	seedWorkspace,
} from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { workspaceDrizzleRepository } from "./common/workspace-drizzle-repository";
import { getPaginatedWorkspaces } from "./paginated-workspaces";

function first<T>(arr: T[]): T {
	expect(arr.length).toBeGreaterThan(0);
	return arr[0] as T;
}

describe("Paginated-Workspaces Integration Tests", () => {
	// ── A. Cursor Validation ─────────────────────────────────────────

	test("Should return PAGINATION_CURSOR_INVALID when cursor is corrupted", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			const result = await getPaginatedWorkspaces({
				query: {
					userId,
					paginationRequest: {
						limit: 10,
						cursor: "not-a-valid-cursor!!!",
						orderBy: "name",
						direction: "asc",
					},
				},
				repository: workspaceDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("PAGINATION_CURSOR_INVALID");
		});
	});

	test("Should return PAGINATION_CURSOR_INVALID when cursor orderBy mismatches request", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const wsId = await seedWorkspace(tx, { name: "Alpha" });
			await addMember(tx, { userId, workspaceId: wsId });

			const cursor = Buffer.from(
				JSON.stringify({
					orderBy: "updatedAt",
					direction: "asc",
					value: "Alpha",
					id: wsId,
				}),
			).toString("base64");

			const result = await getPaginatedWorkspaces({
				query: {
					userId,
					paginationRequest: {
						limit: 10,
						cursor,
						orderBy: "name",
						direction: "asc",
					},
				},
				repository: workspaceDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("PAGINATION_CURSOR_INVALID");
		});
	});

	// ── B. Empty / Isolation ────────────────────────────────────────

	test("Should return empty result when user has no workspaces", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			const result = await getPaginatedWorkspaces({
				query: {
					userId,
					paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
				},
				repository: workspaceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(0);
			expect(result.value.hasNextPage).toBe(false);
			expect(result.value.cursor).toBeNull();
		});
	});

	test("Should not return workspaces the user is not a member of", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			const wsId = await seedWorkspace(tx, { name: "Member Workspace" });
			await addMember(tx, { userId, workspaceId: wsId });

			await seedWorkspace(tx, { name: "Other Workspace" });

			const result = await getPaginatedWorkspaces({
				query: {
					userId,
					paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
				},
				repository: workspaceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(first(result.value.items).name).toBe("Member Workspace");
		});
	});

	test("Should return different results for different users", async () => {
		await runTestInTransaction(async (tx) => {
			const userId1 = await seedUser(tx);
			const userId2 = await seedUser(tx);

			const ws1Id = await seedWorkspace(tx, { name: "User1 Workspace" });
			const ws2Id = await seedWorkspace(tx, { name: "User2 Workspace" });
			await addMember(tx, { userId: userId1, workspaceId: ws1Id });
			await addMember(tx, { userId: userId2, workspaceId: ws2Id });

			const result1 = await getPaginatedWorkspaces({
				query: {
					userId: userId1,
					paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
				},
				repository: workspaceDrizzleRepository(tx),
			});
			const result2 = await getPaginatedWorkspaces({
				query: {
					userId: userId2,
					paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
				},
				repository: workspaceDrizzleRepository(tx),
			});

			expect(result1.value.items).toHaveLength(1);
			expect(first(result1.value.items).name).toBe("User1 Workspace");
			expect(result2.value.items).toHaveLength(1);
			expect(first(result2.value.items).name).toBe("User2 Workspace");
		});
	});

	// ── C. Sorting ──────────────────────────────────────────────────

	test("Should sort by name asc", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			for (const name of ["Charlie", "Alpha", "Bravo"]) {
				const wsId = await seedWorkspace(tx, { name });
				await addMember(tx, { userId, workspaceId: wsId });
			}

			const result = await getPaginatedWorkspaces({
				query: {
					userId,
					paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
				},
				repository: workspaceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((w) => w.name)).toEqual([
				"Alpha",
				"Bravo",
				"Charlie",
			]);
		});
	});

	test("Should sort by name desc", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			for (const name of ["Charlie", "Alpha", "Bravo"]) {
				const wsId = await seedWorkspace(tx, { name });
				await addMember(tx, { userId, workspaceId: wsId });
			}

			const result = await getPaginatedWorkspaces({
				query: {
					userId,
					paginationRequest: { limit: 10, orderBy: "name", direction: "desc" },
				},
				repository: workspaceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((w) => w.name)).toEqual([
				"Charlie",
				"Bravo",
				"Alpha",
			]);
		});
	});

	test("Should sort by updatedAt asc", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			const dateA = new Date("2024-01-01T00:00:00.000Z");
			const dateB = new Date("2024-02-01T00:00:00.000Z");
			const dateC = new Date("2024-03-01T00:00:00.000Z");

			const wsCId = await seedWorkspace(tx, {
				name: "Newest",
				updatedAt: dateC,
			});
			const wsAId = await seedWorkspace(tx, {
				name: "Oldest",
				updatedAt: dateA,
			});
			const wsBId = await seedWorkspace(tx, {
				name: "Middle",
				updatedAt: dateB,
			});
			await addMember(tx, { userId, workspaceId: wsCId });
			await addMember(tx, { userId, workspaceId: wsAId });
			await addMember(tx, { userId, workspaceId: wsBId });

			const result = await getPaginatedWorkspaces({
				query: {
					userId,
					paginationRequest: {
						limit: 10,
						orderBy: "updatedAt",
						direction: "asc",
					},
				},
				repository: workspaceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((w) => w.name)).toEqual([
				"Oldest",
				"Middle",
				"Newest",
			]);
		});
	});

	test("Should sort by updatedAt desc", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			const dateA = new Date("2024-01-01T00:00:00.000Z");
			const dateC = new Date("2024-03-01T00:00:00.000Z");

			const wsAId = await seedWorkspace(tx, {
				name: "Oldest",
				updatedAt: dateA,
			});
			const wsCId = await seedWorkspace(tx, {
				name: "Newest",
				updatedAt: dateC,
			});
			await addMember(tx, { userId, workspaceId: wsAId });
			await addMember(tx, { userId, workspaceId: wsCId });

			const result = await getPaginatedWorkspaces({
				query: {
					userId,
					paginationRequest: {
						limit: 10,
						orderBy: "updatedAt",
						direction: "desc",
					},
				},
				repository: workspaceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((w) => w.name)).toEqual([
				"Newest",
				"Oldest",
			]);
		});
	});

	test("Should sort by id asc", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			const ws1Id = await seedWorkspace(tx, {
				name: "WS1",
				id: "00000000000000000000000001",
			});
			const ws2Id = await seedWorkspace(tx, {
				name: "WS2",
				id: "00000000000000000000000002",
			});
			const ws3Id = await seedWorkspace(tx, {
				name: "WS3",
				id: "00000000000000000000000003",
			});
			await addMember(tx, { userId, workspaceId: ws1Id });
			await addMember(tx, { userId, workspaceId: ws2Id });
			await addMember(tx, { userId, workspaceId: ws3Id });

			const result = await getPaginatedWorkspaces({
				query: {
					userId,
					paginationRequest: { limit: 10, orderBy: "id", direction: "asc" },
				},
				repository: workspaceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((w) => w.id)).toEqual([
				ws1Id,
				ws2Id,
				ws3Id,
			]);
		});
	});

	// ── D. Search ────────────────────────────────────────────────────

	test("Should filter by search on name", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			const ws1Id = await seedWorkspace(tx, { name: "Repair Shop" });
			const ws2Id = await seedWorkspace(tx, { name: "Coffee House" });
			await addMember(tx, { userId, workspaceId: ws1Id });
			await addMember(tx, { userId, workspaceId: ws2Id });

			const result = await getPaginatedWorkspaces({
				query: {
					userId,
					paginationRequest: {
						limit: 10,
						orderBy: "name",
						direction: "asc",
						search: "Repair",
					},
				},
				repository: workspaceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(first(result.value.items).name).toBe("Repair Shop");
		});
	});

	test("Should return empty when search has no matches", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			const ws1Id = await seedWorkspace(tx, { name: "Repair Shop" });
			await addMember(tx, { userId, workspaceId: ws1Id });

			const result = await getPaginatedWorkspaces({
				query: {
					userId,
					paginationRequest: {
						limit: 10,
						orderBy: "name",
						direction: "asc",
						search: "NoExiste",
					},
				},
				repository: workspaceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(0);
			expect(result.value.hasNextPage).toBe(false);
		});
	});

	// ── E. Cursor Pagination ────────────────────────────────────────

	test("Should set hasNextPage=true and a cursor when more items than limit", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			for (const name of ["Alpha", "Bravo", "Charlie"]) {
				const wsId = await seedWorkspace(tx, { name });
				await addMember(tx, { userId, workspaceId: wsId });
			}

			const result = await getPaginatedWorkspaces({
				query: {
					userId,
					paginationRequest: { limit: 2, orderBy: "name", direction: "asc" },
				},
				repository: workspaceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(2);
			expect(result.value.hasNextPage).toBe(true);
			expect(result.value.cursor).not.toBeNull();
			expect(first(result.value.items).name).toBe("Alpha");
			expect(result.value.items[1]?.name).toBe("Bravo");
		});
	});

	test("Should return the second page via cursor", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			for (const name of ["Alpha", "Bravo", "Charlie"]) {
				const wsId = await seedWorkspace(tx, { name });
				await addMember(tx, { userId, workspaceId: wsId });
			}

			const page1 = await getPaginatedWorkspaces({
				query: {
					userId,
					paginationRequest: { limit: 2, orderBy: "name", direction: "asc" },
				},
				repository: workspaceDrizzleRepository(tx),
			});

			expect(page1.isSuccess).toBe(true);
			expect(page1.value.hasNextPage).toBe(true);

			const page2 = await getPaginatedWorkspaces({
				query: {
					userId,
					paginationRequest: {
						limit: 2,
						orderBy: "name",
						direction: "asc",
						cursor: page1.value.cursor ?? undefined,
					},
				},
				repository: workspaceDrizzleRepository(tx),
			});

			expect(page2.isSuccess).toBe(true);
			expect(page2.value.items).toHaveLength(1);
			expect(first(page2.value.items).name).toBe("Charlie");
			expect(page2.value.hasNextPage).toBe(false);
			expect(page2.value.cursor).toBeNull();
		});
	});

	test("Should set hasNextPage=false when items are within limit", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			for (const name of ["Alpha", "Bravo"]) {
				const wsId = await seedWorkspace(tx, { name });
				await addMember(tx, { userId, workspaceId: wsId });
			}

			const result = await getPaginatedWorkspaces({
				query: {
					userId,
					paginationRequest: { limit: 5, orderBy: "name", direction: "asc" },
				},
				repository: workspaceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(2);
			expect(result.value.hasNextPage).toBe(false);
			expect(result.value.cursor).toBeNull();
		});
	});

	test("Should paginate without duplicates or skips on tie-breaking by id", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			const ws1Id = await seedWorkspace(tx, {
				name: "Same",
				id: "00000000000000000000000001",
			});
			const ws2Id = await seedWorkspace(tx, {
				name: "Same",
				id: "00000000000000000000000002",
			});
			const ws3Id = await seedWorkspace(tx, {
				name: "Same",
				id: "00000000000000000000000003",
			});
			await addMember(tx, { userId, workspaceId: ws1Id });
			await addMember(tx, { userId, workspaceId: ws2Id });
			await addMember(tx, { userId, workspaceId: ws3Id });

			const page1 = await getPaginatedWorkspaces({
				query: {
					userId,
					paginationRequest: { limit: 2, orderBy: "name", direction: "asc" },
				},
				repository: workspaceDrizzleRepository(tx),
			});

			expect(page1.isSuccess).toBe(true);
			expect(page1.value.items).toHaveLength(2);

			const page2 = await getPaginatedWorkspaces({
				query: {
					userId,
					paginationRequest: {
						limit: 2,
						orderBy: "name",
						direction: "asc",
						cursor: page1.value.cursor ?? undefined,
					},
				},
				repository: workspaceDrizzleRepository(tx),
			});

			expect(page2.isSuccess).toBe(true);
			expect(page2.value.items).toHaveLength(1);
			expect(page2.value.hasNextPage).toBe(false);

			const allIds = [
				...page1.value.items.map((i) => i.id),
				...page2.value.items.map((i) => i.id),
			].sort();
			const expectedIds = [ws1Id, ws2Id, ws3Id].sort();
			expect(allIds).toEqual(expectedIds);
		});
	});
});
