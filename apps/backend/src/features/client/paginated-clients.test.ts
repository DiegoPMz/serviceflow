import { describe, expect, test } from "bun:test";
import { seedClient } from "@serviceflow/backend/shared/database/seeds/client.seeds";
import { seedWorkspace } from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import { first, runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { clientDrizzleRepository } from "./common/client-drizzle-repository";
import { paginatedClientHandler } from "./paginated-clients";

describe("Paginated-Clients Integration Tests", () => {
	// ── A. Cursor Validation ─────────────────────────────────────────

	test("Should return PAGINATION_CURSOR_INVALID when cursor is corrupted", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			const result = await paginatedClientHandler({
				query: {
					workspaceId,
					paginationRequest: {
						limit: 10,
						cursor: "not-a-valid-cursor!!!",
						orderBy: "name",
						direction: "asc",
					},
				},
				repository: clientDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("PAGINATION_CURSOR_INVALID");
		});
	});

	test("Should return PAGINATION_CURSOR_INVALID when cursor orderBy mismatches request", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const client = await seedClient(tx, { workspaceId, name: "Alpha" });

			const cursor = Buffer.from(
				JSON.stringify({
					orderBy: "email",
					direction: "asc",
					value: client.name,
					id: client.id,
				}),
			).toString("base64");

			const result = await paginatedClientHandler({
				query: {
					workspaceId,
					paginationRequest: {
						limit: 10,
						cursor,
						orderBy: "name",
						direction: "asc",
					},
				},
				repository: clientDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("PAGINATION_CURSOR_INVALID");
		});
	});

	// ── B. Empty / Isolation ────────────────────────────────────────

	test("Should return empty result when workspace has no clients", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			const result = await paginatedClientHandler({
				query: {
					workspaceId,
					paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
				},
				repository: clientDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(0);
			expect(result.value.hasNextPage).toBe(false);
			expect(result.value.cursor).toBeNull();
		});
	});

	test("Should not return clients from another workspace", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const otherWorkspaceId = await seedWorkspace(tx);

			await seedClient(tx, { workspaceId, name: "Mine" });
			await seedClient(tx, { workspaceId: otherWorkspaceId, name: "Theirs" });

			const result = await paginatedClientHandler({
				query: {
					workspaceId,
					paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
				},
				repository: clientDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(first(result.value.items).name).toBe("Mine");
		});
	});

	test("Should return different results for different workspaces", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId1 = await seedWorkspace(tx);
			const workspaceId2 = await seedWorkspace(tx);

			await seedClient(tx, { workspaceId: workspaceId1, name: "WS1 Client" });
			await seedClient(tx, { workspaceId: workspaceId2, name: "WS2 Client" });

			const result1 = await paginatedClientHandler({
				query: {
					workspaceId: workspaceId1,
					paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
				},
				repository: clientDrizzleRepository(tx),
			});
			const result2 = await paginatedClientHandler({
				query: {
					workspaceId: workspaceId2,
					paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
				},
				repository: clientDrizzleRepository(tx),
			});

			expect(result1.value.items).toHaveLength(1);
			expect(first(result1.value.items).name).toBe("WS1 Client");
			expect(result2.value.items).toHaveLength(1);
			expect(first(result2.value.items).name).toBe("WS2 Client");
		});
	});

	// ── C. Sorting ──────────────────────────────────────────────────

	test("Should sort by name asc", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			for (const name of ["Charlie", "Alpha", "Bravo"]) {
				await seedClient(tx, { workspaceId, name });
			}

			const result = await paginatedClientHandler({
				query: {
					workspaceId,
					paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
				},
				repository: clientDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((c) => c.name)).toEqual([
				"Alpha",
				"Bravo",
				"Charlie",
			]);
		});
	});

	test("Should sort by name desc", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			for (const name of ["Charlie", "Alpha", "Bravo"]) {
				await seedClient(tx, { workspaceId, name });
			}

			const result = await paginatedClientHandler({
				query: {
					workspaceId,
					paginationRequest: { limit: 10, orderBy: "name", direction: "desc" },
				},
				repository: clientDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((c) => c.name)).toEqual([
				"Charlie",
				"Bravo",
				"Alpha",
			]);
		});
	});

	test("Should sort by email asc", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			await seedClient(tx, {
				workspaceId,
				name: "Third",
				email: "charlie@example.com",
			});
			await seedClient(tx, {
				workspaceId,
				name: "First",
				email: "alpha@example.com",
			});
			await seedClient(tx, {
				workspaceId,
				name: "Second",
				email: "bravo@example.com",
			});

			const result = await paginatedClientHandler({
				query: {
					workspaceId,
					paginationRequest: { limit: 10, orderBy: "email", direction: "asc" },
				},
				repository: clientDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((c) => c.email)).toEqual([
				"alpha@example.com",
				"bravo@example.com",
				"charlie@example.com",
			]);
		});
	});

	test("Should sort by id asc", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			const c1 = await seedClient(tx, {
				workspaceId,
				name: "C1",
				id: "00000000000000000000000001",
			});
			const c2 = await seedClient(tx, {
				workspaceId,
				name: "C2",
				id: "00000000000000000000000002",
			});
			const c3 = await seedClient(tx, {
				workspaceId,
				name: "C3",
				id: "00000000000000000000000003",
			});

			const result = await paginatedClientHandler({
				query: {
					workspaceId,
					paginationRequest: { limit: 10, orderBy: "id", direction: "asc" },
				},
				repository: clientDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((c) => c.id)).toEqual([
				c1.id,
				c2.id,
				c3.id,
			]);
		});
	});

	// ── D. Search ────────────────────────────────────────────────────

	test("Should filter by search on name", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			await seedClient(tx, { workspaceId, name: "Juan Pérez" });
			await seedClient(tx, { workspaceId, name: "María López" });

			const result = await paginatedClientHandler({
				query: {
					workspaceId,
					paginationRequest: {
						limit: 10,
						orderBy: "name",
						direction: "asc",
						search: "Juan",
					},
				},
				repository: clientDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(first(result.value.items).name).toBe("Juan Pérez");
		});
	});

	test("Should filter by search on email", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			await seedClient(tx, {
				workspaceId,
				name: "Juan",
				email: "unique-match@example.com",
			});
			await seedClient(tx, {
				workspaceId,
				name: "María",
				email: "other@example.com",
			});

			const result = await paginatedClientHandler({
				query: {
					workspaceId,
					paginationRequest: {
						limit: 10,
						orderBy: "name",
						direction: "asc",
						search: "unique-match",
					},
				},
				repository: clientDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(first(result.value.items).email).toBe("unique-match@example.com");
		});
	});

	test("Should filter by search on phone", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			await seedClient(tx, {
				workspaceId,
				name: "Juan",
				phoneNumber: "+525599887766",
			});
			await seedClient(tx, {
				workspaceId,
				name: "María",
				phoneNumber: "+525511223344",
			});

			const result = await paginatedClientHandler({
				query: {
					workspaceId,
					paginationRequest: {
						limit: 10,
						orderBy: "name",
						direction: "asc",
						search: "99887766",
					},
				},
				repository: clientDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(first(result.value.items).phoneNumber).toBe("+525599887766");
		});
	});

	test("Should return empty when search has no matches", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			await seedClient(tx, { workspaceId, name: "Juan Pérez" });

			const result = await paginatedClientHandler({
				query: {
					workspaceId,
					paginationRequest: {
						limit: 10,
						orderBy: "name",
						direction: "asc",
						search: "NoExiste",
					},
				},
				repository: clientDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(0);
			expect(result.value.hasNextPage).toBe(false);
		});
	});

	// ── E. Cursor Pagination ────────────────────────────────────────

	test("Should set hasNextPage=true and a cursor when more items than limit", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			for (const name of ["Alpha", "Bravo", "Charlie"]) {
				await seedClient(tx, { workspaceId, name });
			}

			const result = await paginatedClientHandler({
				query: {
					workspaceId,
					paginationRequest: { limit: 2, orderBy: "name", direction: "asc" },
				},
				repository: clientDrizzleRepository(tx),
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
			const workspaceId = await seedWorkspace(tx);

			for (const name of ["Alpha", "Bravo", "Charlie"]) {
				await seedClient(tx, { workspaceId, name });
			}

			const page1 = await paginatedClientHandler({
				query: {
					workspaceId,
					paginationRequest: { limit: 2, orderBy: "name", direction: "asc" },
				},
				repository: clientDrizzleRepository(tx),
			});

			expect(page1.isSuccess).toBe(true);
			expect(page1.value.hasNextPage).toBe(true);

			const page2 = await paginatedClientHandler({
				query: {
					workspaceId,
					paginationRequest: {
						limit: 2,
						orderBy: "name",
						direction: "asc",
						cursor: page1.value.cursor ?? undefined,
					},
				},
				repository: clientDrizzleRepository(tx),
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
			const workspaceId = await seedWorkspace(tx);

			for (const name of ["Alpha", "Bravo"]) {
				await seedClient(tx, { workspaceId, name });
			}

			const result = await paginatedClientHandler({
				query: {
					workspaceId,
					paginationRequest: { limit: 5, orderBy: "name", direction: "asc" },
				},
				repository: clientDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(2);
			expect(result.value.hasNextPage).toBe(false);
			expect(result.value.cursor).toBeNull();
		});
	});

	test("Should paginate without duplicates or skips on tie-breaking by id", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			const c1 = await seedClient(tx, {
				workspaceId,
				name: "Same",
				id: "00000000000000000000000001",
			});
			const c2 = await seedClient(tx, {
				workspaceId,
				name: "Same",
				id: "00000000000000000000000002",
			});
			const c3 = await seedClient(tx, {
				workspaceId,
				name: "Same",
				id: "00000000000000000000000003",
			});

			const page1 = await paginatedClientHandler({
				query: {
					workspaceId,
					paginationRequest: { limit: 2, orderBy: "name", direction: "asc" },
				},
				repository: clientDrizzleRepository(tx),
			});

			expect(page1.isSuccess).toBe(true);
			expect(page1.value.items).toHaveLength(2);

			const page2 = await paginatedClientHandler({
				query: {
					workspaceId,
					paginationRequest: {
						limit: 2,
						orderBy: "name",
						direction: "asc",
						cursor: page1.value.cursor ?? undefined,
					},
				},
				repository: clientDrizzleRepository(tx),
			});

			expect(page2.isSuccess).toBe(true);
			expect(page2.value.items).toHaveLength(1);
			expect(page2.value.hasNextPage).toBe(false);

			const allIds = [
				...page1.value.items.map((i) => i.id),
				...page2.value.items.map((i) => i.id),
			].sort();
			const expectedIds = [c1.id, c2.id, c3.id].sort();
			expect(allIds).toEqual(expectedIds);
		});
	});
});
