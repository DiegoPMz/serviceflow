import { afterEach, describe, expect, test } from "bun:test";
import {
	type DatabaseClient,
	type DatabaseType,
	db,
	users,
	workspaceMembers,
	workspaces,
} from "@serviceflow/backend/shared/database";
import { eq } from "drizzle-orm";
import { ulid } from "ulidx";
import { workspaceDrizzleRepository } from "./common/workspace-drizzle-repository";
import { getPaginatedWorkspaces } from "./paginated-workspaces";

type Db = DatabaseType | DatabaseClient;

const seededUsers: string[] = [];
const seededWorkspaces: string[] = [];

const seedUser = async (db: Db) => {
	const userId = ulid();
	await db.insert(users).values({
		id: userId,
		name: "Test User",
		email: `user-${userId}@example.com`,
	});
	seededUsers.push(userId);
	return userId;
};

const seedWorkspace = async (
	db: Db,
	opts: {
		name?: string;
		prefix?: string;
		updatedAt?: Date;
		id?: string;
	} = {},
) => {
	const id = opts.id ?? ulid();
	const values: {
		id: string;
		name: string;
		prefix: string;
		orderCount: number;
		updatedAt?: Date;
	} = {
		id,
		name: opts.name ?? "Test Workspace",
		prefix: opts.prefix ?? `P${id.slice(-5)}`,
		orderCount: 0,
	};
	if (opts.updatedAt) values.updatedAt = opts.updatedAt;

	const [row] = await db.insert(workspaces).values(values).returning();
	if (!row) throw new Error("Failed to create test workspace");
	seededWorkspaces.push(id);
	return row;
};

const addMember = async (
	db: Db,
	opts: {
		userId: string;
		workspaceId: string;
		role?: "owner" | "admin" | "technician" | "viewer";
	},
) => {
	await db.insert(workspaceMembers).values({
		userId: opts.userId,
		workspaceId: opts.workspaceId,
		role: opts.role ?? "owner",
	});
};

function first<T>(arr: T[]): T {
	expect(arr.length).toBeGreaterThan(0);
	return arr[0] as T;
}

afterEach(async () => {
	for (const workspaceId of seededWorkspaces) {
		await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
	}
	for (const userId of seededUsers) {
		await db.delete(users).where(eq(users.id, userId));
	}
	seededWorkspaces.length = 0;
	seededUsers.length = 0;
});

describe("Paginated-Workspaces Integration Tests", () => {
	// ── A. Cursor Validation ─────────────────────────────────────────

	test("Should return PAGINATION_CURSOR_INVALID when cursor is corrupted", async () => {
		const userId = await seedUser(db);

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
			repository: workspaceDrizzleRepository(db),
		});

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("PAGINATION_CURSOR_INVALID");
	});

	test("Should return PAGINATION_CURSOR_INVALID when cursor orderBy mismatches request", async () => {
		const userId = await seedUser(db);
		const ws = await seedWorkspace(db, { name: "Alpha" });
		await addMember(db, { userId, workspaceId: ws.id });

		const cursor = Buffer.from(
			JSON.stringify({
				orderBy: "updatedAt",
				direction: "asc",
				value: ws.name,
				id: ws.id,
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
			repository: workspaceDrizzleRepository(db),
		});

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("PAGINATION_CURSOR_INVALID");
	});

	// ── B. Empty / Isolation ────────────────────────────────────────

	test("Should return empty result when user has no workspaces", async () => {
		const userId = await seedUser(db);

		const result = await getPaginatedWorkspaces({
			query: {
				userId,
				paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
			},
			repository: workspaceDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items).toHaveLength(0);
		expect(result.value.hasNextPage).toBe(false);
		expect(result.value.cursor).toBeNull();
	});

	test("Should not return workspaces the user is not a member of", async () => {
		const userId = await seedUser(db);

		const wsMember = await seedWorkspace(db, { name: "Member Workspace" });
		await addMember(db, { userId, workspaceId: wsMember.id });

		await seedWorkspace(db, { name: "Other Workspace" });

		const result = await getPaginatedWorkspaces({
			query: {
				userId,
				paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
			},
			repository: workspaceDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items).toHaveLength(1);
		expect(first(result.value.items).name).toBe("Member Workspace");
	});

	test("Should return different results for different users", async () => {
		const userId1 = await seedUser(db);
		const userId2 = await seedUser(db);

		const ws1 = await seedWorkspace(db, { name: "User1 Workspace" });
		const ws2 = await seedWorkspace(db, { name: "User2 Workspace" });
		await addMember(db, { userId: userId1, workspaceId: ws1.id });
		await addMember(db, { userId: userId2, workspaceId: ws2.id });

		const result1 = await getPaginatedWorkspaces({
			query: {
				userId: userId1,
				paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
			},
			repository: workspaceDrizzleRepository(db),
		});
		const result2 = await getPaginatedWorkspaces({
			query: {
				userId: userId2,
				paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
			},
			repository: workspaceDrizzleRepository(db),
		});

		expect(result1.value.items).toHaveLength(1);
		expect(first(result1.value.items).name).toBe("User1 Workspace");
		expect(result2.value.items).toHaveLength(1);
		expect(first(result2.value.items).name).toBe("User2 Workspace");
	});

	// ── C. Sorting ──────────────────────────────────────────────────

	test("Should sort by name asc", async () => {
		const userId = await seedUser(db);

		for (const name of ["Charlie", "Alpha", "Bravo"]) {
			const ws = await seedWorkspace(db, { name });
			await addMember(db, { userId, workspaceId: ws.id });
		}

		const result = await getPaginatedWorkspaces({
			query: {
				userId,
				paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
			},
			repository: workspaceDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items.map((w) => w.name)).toEqual([
			"Alpha",
			"Bravo",
			"Charlie",
		]);
	});

	test("Should sort by name desc", async () => {
		const userId = await seedUser(db);

		for (const name of ["Charlie", "Alpha", "Bravo"]) {
			const ws = await seedWorkspace(db, { name });
			await addMember(db, { userId, workspaceId: ws.id });
		}

		const result = await getPaginatedWorkspaces({
			query: {
				userId,
				paginationRequest: { limit: 10, orderBy: "name", direction: "desc" },
			},
			repository: workspaceDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items.map((w) => w.name)).toEqual([
			"Charlie",
			"Bravo",
			"Alpha",
		]);
	});

	test("Should sort by updatedAt asc", async () => {
		const userId = await seedUser(db);

		const dateA = new Date("2024-01-01T00:00:00.000Z");
		const dateB = new Date("2024-02-01T00:00:00.000Z");
		const dateC = new Date("2024-03-01T00:00:00.000Z");

		const wsC = await seedWorkspace(db, { name: "Newest", updatedAt: dateC });
		const wsA = await seedWorkspace(db, { name: "Oldest", updatedAt: dateA });
		const wsB = await seedWorkspace(db, { name: "Middle", updatedAt: dateB });
		await addMember(db, { userId, workspaceId: wsC.id });
		await addMember(db, { userId, workspaceId: wsA.id });
		await addMember(db, { userId, workspaceId: wsB.id });

		const result = await getPaginatedWorkspaces({
			query: {
				userId,
				paginationRequest: {
					limit: 10,
					orderBy: "updatedAt",
					direction: "asc",
				},
			},
			repository: workspaceDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items.map((w) => w.name)).toEqual([
			"Oldest",
			"Middle",
			"Newest",
		]);
	});

	test("Should sort by updatedAt desc", async () => {
		const userId = await seedUser(db);

		const dateA = new Date("2024-01-01T00:00:00.000Z");
		const dateC = new Date("2024-03-01T00:00:00.000Z");

		const wsA = await seedWorkspace(db, { name: "Oldest", updatedAt: dateA });
		const wsC = await seedWorkspace(db, { name: "Newest", updatedAt: dateC });
		await addMember(db, { userId, workspaceId: wsA.id });
		await addMember(db, { userId, workspaceId: wsC.id });

		const result = await getPaginatedWorkspaces({
			query: {
				userId,
				paginationRequest: {
					limit: 10,
					orderBy: "updatedAt",
					direction: "desc",
				},
			},
			repository: workspaceDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items.map((w) => w.name)).toEqual(["Newest", "Oldest"]);
	});

	test("Should sort by id asc", async () => {
		const userId = await seedUser(db);

		const ws1 = await seedWorkspace(db, {
			name: "WS1",
			id: "00000000000000000000000001",
		});
		const ws2 = await seedWorkspace(db, {
			name: "WS2",
			id: "00000000000000000000000002",
		});
		const ws3 = await seedWorkspace(db, {
			name: "WS3",
			id: "00000000000000000000000003",
		});
		await addMember(db, { userId, workspaceId: ws1.id });
		await addMember(db, { userId, workspaceId: ws2.id });
		await addMember(db, { userId, workspaceId: ws3.id });

		const result = await getPaginatedWorkspaces({
			query: {
				userId,
				paginationRequest: { limit: 10, orderBy: "id", direction: "asc" },
			},
			repository: workspaceDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items.map((w) => w.id)).toEqual([
			ws1.id,
			ws2.id,
			ws3.id,
		]);
	});

	// ── D. Search ────────────────────────────────────────────────────

	test("Should filter by search on name", async () => {
		const userId = await seedUser(db);

		const ws1 = await seedWorkspace(db, { name: "Repair Shop" });
		const ws2 = await seedWorkspace(db, { name: "Coffee House" });
		await addMember(db, { userId, workspaceId: ws1.id });
		await addMember(db, { userId, workspaceId: ws2.id });

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
			repository: workspaceDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items).toHaveLength(1);
		expect(first(result.value.items).name).toBe("Repair Shop");
	});

	test("Should return empty when search has no matches", async () => {
		const userId = await seedUser(db);

		const ws1 = await seedWorkspace(db, { name: "Repair Shop" });
		await addMember(db, { userId, workspaceId: ws1.id });

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
			repository: workspaceDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items).toHaveLength(0);
		expect(result.value.hasNextPage).toBe(false);
	});

	// ── E. Cursor Pagination ────────────────────────────────────────

	test("Should set hasNextPage=true and a cursor when more items than limit", async () => {
		const userId = await seedUser(db);

		for (const name of ["Alpha", "Bravo", "Charlie"]) {
			const ws = await seedWorkspace(db, { name });
			await addMember(db, { userId, workspaceId: ws.id });
		}

		const result = await getPaginatedWorkspaces({
			query: {
				userId,
				paginationRequest: { limit: 2, orderBy: "name", direction: "asc" },
			},
			repository: workspaceDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items).toHaveLength(2);
		expect(result.value.hasNextPage).toBe(true);
		expect(result.value.cursor).not.toBeNull();
		expect(first(result.value.items).name).toBe("Alpha");
		expect(result.value.items[1]?.name).toBe("Bravo");
	});

	test("Should return the second page via cursor", async () => {
		const userId = await seedUser(db);

		for (const name of ["Alpha", "Bravo", "Charlie"]) {
			const ws = await seedWorkspace(db, { name });
			await addMember(db, { userId, workspaceId: ws.id });
		}

		const page1 = await getPaginatedWorkspaces({
			query: {
				userId,
				paginationRequest: { limit: 2, orderBy: "name", direction: "asc" },
			},
			repository: workspaceDrizzleRepository(db),
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
			repository: workspaceDrizzleRepository(db),
		});

		expect(page2.isSuccess).toBe(true);
		expect(page2.value.items).toHaveLength(1);
		expect(first(page2.value.items).name).toBe("Charlie");
		expect(page2.value.hasNextPage).toBe(false);
		expect(page2.value.cursor).toBeNull();
	});

	test("Should set hasNextPage=false when items are within limit", async () => {
		const userId = await seedUser(db);

		for (const name of ["Alpha", "Bravo"]) {
			const ws = await seedWorkspace(db, { name });
			await addMember(db, { userId, workspaceId: ws.id });
		}

		const result = await getPaginatedWorkspaces({
			query: {
				userId,
				paginationRequest: { limit: 5, orderBy: "name", direction: "asc" },
			},
			repository: workspaceDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items).toHaveLength(2);
		expect(result.value.hasNextPage).toBe(false);
		expect(result.value.cursor).toBeNull();
	});

	test("Should paginate without duplicates or skips on tie-breaking by id", async () => {
		const userId = await seedUser(db);

		const ws1 = await seedWorkspace(db, {
			name: "Same",
			id: "00000000000000000000000001",
		});
		const ws2 = await seedWorkspace(db, {
			name: "Same",
			id: "00000000000000000000000002",
		});
		const ws3 = await seedWorkspace(db, {
			name: "Same",
			id: "00000000000000000000000003",
		});
		await addMember(db, { userId, workspaceId: ws1.id });
		await addMember(db, { userId, workspaceId: ws2.id });
		await addMember(db, { userId, workspaceId: ws3.id });

		const page1 = await getPaginatedWorkspaces({
			query: {
				userId,
				paginationRequest: { limit: 2, orderBy: "name", direction: "asc" },
			},
			repository: workspaceDrizzleRepository(db),
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
			repository: workspaceDrizzleRepository(db),
		});

		expect(page2.isSuccess).toBe(true);
		expect(page2.value.items).toHaveLength(1);
		expect(page2.value.hasNextPage).toBe(false);

		const allIds = [
			...page1.value.items.map((i) => i.id),
			...page2.value.items.map((i) => i.id),
		].sort();
		const expectedIds = [ws1.id, ws2.id, ws3.id].sort();
		expect(allIds).toEqual(expectedIds);
	});
});
