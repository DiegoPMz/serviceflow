import { afterEach, describe, expect, test } from "bun:test";
import {
	clients,
	type DatabaseClient,
	type DatabaseType,
	db,
	workspaces,
} from "@serviceflow/backend/shared/database";
import { eq } from "drizzle-orm";
import { ulid } from "ulidx";
import { clientDrizzleRepository } from "./common/client-drizzle-repository";
import { paginatedClientQueryHandler } from "./paginated-clients";

type Db = DatabaseType | DatabaseClient;

const seededClients: string[] = [];
const seededWorkspaces: string[] = [];

const seedWorkspace = async (db: Db) => {
	const id = ulid();
	await db.insert(workspaces).values({
		id,
		name: "Test Workspace",
		prefix: `P${id.slice(-5)}`,
		orderCount: 0,
	});
	seededWorkspaces.push(id);
	return id;
};

const seedClient = async (
	db: Db,
	opts: {
		workspaceId: string;
		name?: string;
		email?: string;
		phoneNumber?: string;
		location?: string;
		id?: string;
	},
) => {
	const id = opts.id ?? ulid();
	const [row] = await db
		.insert(clients)
		.values({
			id,
			workspaceId: opts.workspaceId,
			name: opts.name ?? "Test Client",
			email: opts.email ?? `client-${id}@example.com`,
			phoneNumber: opts.phoneNumber ?? `+52155${id.slice(-8)}`,
			location: opts.location ?? "CDMX",
		})
		.returning();
	if (!row) throw new Error("Failed to create test client");
	seededClients.push(id);
	return row;
};

function first<T>(arr: T[]): T {
	expect(arr.length).toBeGreaterThan(0);
	return arr[0] as T;
}

afterEach(async () => {
	for (const clientId of seededClients) {
		await db.delete(clients).where(eq(clients.id, clientId));
	}
	for (const workspaceId of seededWorkspaces) {
		await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
	}
	seededClients.length = 0;
	seededWorkspaces.length = 0;
});

describe("Paginated-Clients Integration Tests", () => {
	// ── A. Cursor Validation ─────────────────────────────────────────

	test("Should return PAGINATION_CURSOR_INVALID when cursor is corrupted", async () => {
		const workspaceId = await seedWorkspace(db);

		const result = await paginatedClientQueryHandler({
			query: {
				workspaceId,
				paginationRequest: {
					limit: 10,
					cursor: "not-a-valid-cursor!!!",
					orderBy: "name",
					direction: "asc",
				},
			},
			repository: clientDrizzleRepository(db),
		});

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("PAGINATION_CURSOR_INVALID");
	});

	test("Should return PAGINATION_CURSOR_INVALID when cursor orderBy mismatches request", async () => {
		const workspaceId = await seedWorkspace(db);
		const client = await seedClient(db, { workspaceId, name: "Alpha" });

		const cursor = Buffer.from(
			JSON.stringify({
				orderBy: "email",
				direction: "asc",
				value: client.name,
				id: client.id,
			}),
		).toString("base64");

		const result = await paginatedClientQueryHandler({
			query: {
				workspaceId,
				paginationRequest: {
					limit: 10,
					cursor,
					orderBy: "name",
					direction: "asc",
				},
			},
			repository: clientDrizzleRepository(db),
		});

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("PAGINATION_CURSOR_INVALID");
	});

	// ── B. Empty / Isolation ────────────────────────────────────────

	test("Should return empty result when workspace has no clients", async () => {
		const workspaceId = await seedWorkspace(db);

		const result = await paginatedClientQueryHandler({
			query: {
				workspaceId,
				paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
			},
			repository: clientDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items).toHaveLength(0);
		expect(result.value.hasNextPage).toBe(false);
		expect(result.value.cursor).toBeNull();
	});

	test("Should not return clients from another workspace", async () => {
		const workspaceId = await seedWorkspace(db);
		const otherWorkspaceId = await seedWorkspace(db);

		await seedClient(db, { workspaceId, name: "Mine" });
		await seedClient(db, { workspaceId: otherWorkspaceId, name: "Theirs" });

		const result = await paginatedClientQueryHandler({
			query: {
				workspaceId,
				paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
			},
			repository: clientDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items).toHaveLength(1);
		expect(first(result.value.items).name).toBe("Mine");
	});

	test("Should return different results for different workspaces", async () => {
		const workspaceId1 = await seedWorkspace(db);
		const workspaceId2 = await seedWorkspace(db);

		await seedClient(db, { workspaceId: workspaceId1, name: "WS1 Client" });
		await seedClient(db, { workspaceId: workspaceId2, name: "WS2 Client" });

		const result1 = await paginatedClientQueryHandler({
			query: {
				workspaceId: workspaceId1,
				paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
			},
			repository: clientDrizzleRepository(db),
		});
		const result2 = await paginatedClientQueryHandler({
			query: {
				workspaceId: workspaceId2,
				paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
			},
			repository: clientDrizzleRepository(db),
		});

		expect(result1.value.items).toHaveLength(1);
		expect(first(result1.value.items).name).toBe("WS1 Client");
		expect(result2.value.items).toHaveLength(1);
		expect(first(result2.value.items).name).toBe("WS2 Client");
	});

	// ── C. Sorting ──────────────────────────────────────────────────

	test("Should sort by name asc", async () => {
		const workspaceId = await seedWorkspace(db);

		for (const name of ["Charlie", "Alpha", "Bravo"]) {
			await seedClient(db, { workspaceId, name });
		}

		const result = await paginatedClientQueryHandler({
			query: {
				workspaceId,
				paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
			},
			repository: clientDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items.map((c) => c.name)).toEqual([
			"Alpha",
			"Bravo",
			"Charlie",
		]);
	});

	test("Should sort by name desc", async () => {
		const workspaceId = await seedWorkspace(db);

		for (const name of ["Charlie", "Alpha", "Bravo"]) {
			await seedClient(db, { workspaceId, name });
		}

		const result = await paginatedClientQueryHandler({
			query: {
				workspaceId,
				paginationRequest: { limit: 10, orderBy: "name", direction: "desc" },
			},
			repository: clientDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items.map((c) => c.name)).toEqual([
			"Charlie",
			"Bravo",
			"Alpha",
		]);
	});

	test("Should sort by email asc", async () => {
		const workspaceId = await seedWorkspace(db);

		await seedClient(db, {
			workspaceId,
			name: "Third",
			email: "charlie@example.com",
		});
		await seedClient(db, {
			workspaceId,
			name: "First",
			email: "alpha@example.com",
		});
		await seedClient(db, {
			workspaceId,
			name: "Second",
			email: "bravo@example.com",
		});

		const result = await paginatedClientQueryHandler({
			query: {
				workspaceId,
				paginationRequest: { limit: 10, orderBy: "email", direction: "asc" },
			},
			repository: clientDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items.map((c) => c.email)).toEqual([
			"alpha@example.com",
			"bravo@example.com",
			"charlie@example.com",
		]);
	});

	test("Should sort by id asc", async () => {
		const workspaceId = await seedWorkspace(db);

		const c1 = await seedClient(db, {
			workspaceId,
			name: "C1",
			id: "00000000000000000000000001",
		});
		const c2 = await seedClient(db, {
			workspaceId,
			name: "C2",
			id: "00000000000000000000000002",
		});
		const c3 = await seedClient(db, {
			workspaceId,
			name: "C3",
			id: "00000000000000000000000003",
		});

		const result = await paginatedClientQueryHandler({
			query: {
				workspaceId,
				paginationRequest: { limit: 10, orderBy: "id", direction: "asc" },
			},
			repository: clientDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items.map((c) => c.id)).toEqual([c1.id, c2.id, c3.id]);
	});

	// ── D. Search ────────────────────────────────────────────────────

	test("Should filter by search on name", async () => {
		const workspaceId = await seedWorkspace(db);

		await seedClient(db, { workspaceId, name: "Juan Pérez" });
		await seedClient(db, { workspaceId, name: "María López" });

		const result = await paginatedClientQueryHandler({
			query: {
				workspaceId,
				paginationRequest: {
					limit: 10,
					orderBy: "name",
					direction: "asc",
					search: "Juan",
				},
			},
			repository: clientDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items).toHaveLength(1);
		expect(first(result.value.items).name).toBe("Juan Pérez");
	});

	test("Should filter by search on email", async () => {
		const workspaceId = await seedWorkspace(db);

		await seedClient(db, {
			workspaceId,
			name: "Juan",
			email: "unique-match@example.com",
		});
		await seedClient(db, {
			workspaceId,
			name: "María",
			email: "other@example.com",
		});

		const result = await paginatedClientQueryHandler({
			query: {
				workspaceId,
				paginationRequest: {
					limit: 10,
					orderBy: "name",
					direction: "asc",
					search: "unique-match",
				},
			},
			repository: clientDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items).toHaveLength(1);
		expect(first(result.value.items).email).toBe("unique-match@example.com");
	});

	test("Should filter by search on phone", async () => {
		const workspaceId = await seedWorkspace(db);

		await seedClient(db, {
			workspaceId,
			name: "Juan",
			phoneNumber: "+525599887766",
		});
		await seedClient(db, {
			workspaceId,
			name: "María",
			phoneNumber: "+525511223344",
		});

		const result = await paginatedClientQueryHandler({
			query: {
				workspaceId,
				paginationRequest: {
					limit: 10,
					orderBy: "name",
					direction: "asc",
					search: "99887766",
				},
			},
			repository: clientDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items).toHaveLength(1);
		expect(first(result.value.items).phoneNumber).toBe("+525599887766");
	});

	test("Should return empty when search has no matches", async () => {
		const workspaceId = await seedWorkspace(db);

		await seedClient(db, { workspaceId, name: "Juan Pérez" });

		const result = await paginatedClientQueryHandler({
			query: {
				workspaceId,
				paginationRequest: {
					limit: 10,
					orderBy: "name",
					direction: "asc",
					search: "NoExiste",
				},
			},
			repository: clientDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items).toHaveLength(0);
		expect(result.value.hasNextPage).toBe(false);
	});

	// ── E. Cursor Pagination ────────────────────────────────────────

	test("Should set hasNextPage=true and a cursor when more items than limit", async () => {
		const workspaceId = await seedWorkspace(db);

		for (const name of ["Alpha", "Bravo", "Charlie"]) {
			await seedClient(db, { workspaceId, name });
		}

		const result = await paginatedClientQueryHandler({
			query: {
				workspaceId,
				paginationRequest: { limit: 2, orderBy: "name", direction: "asc" },
			},
			repository: clientDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items).toHaveLength(2);
		expect(result.value.hasNextPage).toBe(true);
		expect(result.value.cursor).not.toBeNull();
		expect(first(result.value.items).name).toBe("Alpha");
		expect(result.value.items[1]?.name).toBe("Bravo");
	});

	test("Should return the second page via cursor", async () => {
		const workspaceId = await seedWorkspace(db);

		for (const name of ["Alpha", "Bravo", "Charlie"]) {
			await seedClient(db, { workspaceId, name });
		}

		const page1 = await paginatedClientQueryHandler({
			query: {
				workspaceId,
				paginationRequest: { limit: 2, orderBy: "name", direction: "asc" },
			},
			repository: clientDrizzleRepository(db),
		});

		expect(page1.isSuccess).toBe(true);
		expect(page1.value.hasNextPage).toBe(true);

		const page2 = await paginatedClientQueryHandler({
			query: {
				workspaceId,
				paginationRequest: {
					limit: 2,
					orderBy: "name",
					direction: "asc",
					cursor: page1.value.cursor ?? undefined,
				},
			},
			repository: clientDrizzleRepository(db),
		});

		expect(page2.isSuccess).toBe(true);
		expect(page2.value.items).toHaveLength(1);
		expect(first(page2.value.items).name).toBe("Charlie");
		expect(page2.value.hasNextPage).toBe(false);
		expect(page2.value.cursor).toBeNull();
	});

	test("Should set hasNextPage=false when items are within limit", async () => {
		const workspaceId = await seedWorkspace(db);

		for (const name of ["Alpha", "Bravo"]) {
			await seedClient(db, { workspaceId, name });
		}

		const result = await paginatedClientQueryHandler({
			query: {
				workspaceId,
				paginationRequest: { limit: 5, orderBy: "name", direction: "asc" },
			},
			repository: clientDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items).toHaveLength(2);
		expect(result.value.hasNextPage).toBe(false);
		expect(result.value.cursor).toBeNull();
	});

	test("Should paginate without duplicates or skips on tie-breaking by id", async () => {
		const workspaceId = await seedWorkspace(db);

		const c1 = await seedClient(db, {
			workspaceId,
			name: "Same",
			id: "00000000000000000000000001",
		});
		const c2 = await seedClient(db, {
			workspaceId,
			name: "Same",
			id: "00000000000000000000000002",
		});
		const c3 = await seedClient(db, {
			workspaceId,
			name: "Same",
			id: "00000000000000000000000003",
		});

		const page1 = await paginatedClientQueryHandler({
			query: {
				workspaceId,
				paginationRequest: { limit: 2, orderBy: "name", direction: "asc" },
			},
			repository: clientDrizzleRepository(db),
		});

		expect(page1.isSuccess).toBe(true);
		expect(page1.value.items).toHaveLength(2);

		const page2 = await paginatedClientQueryHandler({
			query: {
				workspaceId,
				paginationRequest: {
					limit: 2,
					orderBy: "name",
					direction: "asc",
					cursor: page1.value.cursor ?? undefined,
				},
			},
			repository: clientDrizzleRepository(db),
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
