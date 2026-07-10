import { describe, expect, test } from "bun:test";
import {
	type DatabaseClient,
	users,
	workspaceMembers,
	workspaces,
} from "@serviceflow/backend/shared/database";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { workspaceErrors } from "./common/workspace.errors";
import { getPaginatedWorkspaces } from "./paginated-workspaces";

function first<T>(arr: T[]): T {
	expect(arr.length).toBeGreaterThan(0);
	return arr[0] as T;
}

const DATE_A = new Date("2024-01-01T00:00:00.000Z");
const DATE_B = new Date("2024-02-01T00:00:00.000Z");
const DATE_C = new Date("2024-03-01T00:00:00.000Z");

async function createTestWorkspace(
	tx: DatabaseClient,
	opts: { name: string; createdAt: Date; updatedAt: Date; id?: string },
) {
	const id = opts.id ?? crypto.randomUUID();
	const [row] = await tx
		.insert(workspaces)
		.values({
			id,
			name: opts.name,
			createdAt: opts.createdAt,
			updatedAt: opts.updatedAt,
		})
		.returning();
	if (!row) throw new Error("Failed to create test workspace");
	return row;
}

async function addMember(
	tx: DatabaseClient,
	opts: {
		userId: string;
		workspaceId: string;
		role?: "owner" | "admin" | "technician" | "viewer";
	},
) {
	await tx.insert(workspaceMembers).values({
		userId: opts.userId,
		workspaceId: opts.workspaceId,
		role: opts.role ?? "owner",
	});
}

async function createUser(
	tx: DatabaseClient,
	overrides?: { id?: string; name?: string; email?: string },
) {
	const id = overrides?.id ?? crypto.randomUUID();
	await tx.insert(users).values({
		id,
		name: overrides?.name ?? "Test User",
		email: overrides?.email ?? `test-${id}@example.com`,
	});
	return id;
}

describe("Workspace-Paginated Integration Tests", () => {
	// ── A. Input Validation ────────────────────────────────────────────

	test("Should return WORKSPACE_LIMIT_EXCEEDED when limit is <= 0", () =>
		runTestInTransaction(async (tx) => {
			const userId = crypto.randomUUID();

			const result = await getPaginatedWorkspaces({
				query: { userId, limit: 0 },
				dbClient: tx,
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(
				workspaceErrors.WORKSPACE_LIMIT_EXCEEDED.code,
			);
		}));

	test("Should return WORKSPACE_LIMIT_EXCEEDED when limit exceeds 50", () =>
		runTestInTransaction(async (tx) => {
			const userId = crypto.randomUUID();

			const result = await getPaginatedWorkspaces({
				query: { userId, limit: 51 },
				dbClient: tx,
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(
				workspaceErrors.WORKSPACE_LIMIT_EXCEEDED.code,
			);
		}));

	test("Should return WORKSPACE_INVALID_CURSOR when cursor is corrupted", () =>
		runTestInTransaction(async (tx) => {
			const userId = crypto.randomUUID();

			const result = await getPaginatedWorkspaces({
				query: { userId, limit: 10, cursor: "not-a-valid-cursor!!!" },
				dbClient: tx,
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("WORKSPACE_INVALID_CURSOR");
		}));

	// ── B. Empty / Minimal State ───────────────────────────────────────

	test("Should return empty result when user has no workspaces", () =>
		runTestInTransaction(async (tx) => {
			const userId = crypto.randomUUID();

			const result = await getPaginatedWorkspaces({
				query: { userId, limit: 10 },
				dbClient: tx,
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(0);
			expect(result.value.hasNextPage).toBe(false);
			expect(result.value.cursor).toBeNull();
		}));

	// ── C. Basic Query Behavior ────────────────────────────────────────

	test("Should not return workspaces the user is not a member of", () =>
		runTestInTransaction(async (tx) => {
			const userId = await createUser(tx);

			const wsMember = await createTestWorkspace(tx, {
				name: "Member Workspace",
				createdAt: DATE_A,
				updatedAt: DATE_A,
			});
			await addMember(tx, { userId, workspaceId: wsMember.id });

			await createTestWorkspace(tx, {
				name: "Other Workspace",
				createdAt: DATE_B,
				updatedAt: DATE_B,
			});

			const result = await getPaginatedWorkspaces({
				query: { userId, limit: 10 },
				dbClient: tx,
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(first(result.value.items).name).toBe("Member Workspace");
		}));

	test("Should return different results for different users", () =>
		runTestInTransaction(async (tx) => {
			const userId1 = await createUser(tx, {
				name: "User 1",
				email: "u1@test.com",
			});
			const userId2 = await createUser(tx, {
				name: "User 2",
				email: "u2@test.com",
			});

			const ws1 = await createTestWorkspace(tx, {
				name: "User1 Workspace",
				createdAt: DATE_A,
				updatedAt: DATE_A,
			});
			const ws2 = await createTestWorkspace(tx, {
				name: "User2 Workspace",
				createdAt: DATE_A,
				updatedAt: DATE_A,
			});
			await addMember(tx, { userId: userId1, workspaceId: ws1.id });
			await addMember(tx, { userId: userId2, workspaceId: ws2.id });

			const result1 = await getPaginatedWorkspaces({
				query: { userId: userId1, limit: 10 },
				dbClient: tx,
			});
			const result2 = await getPaginatedWorkspaces({
				query: { userId: userId2, limit: 10 },
				dbClient: tx,
			});

			expect(result1.value.items).toHaveLength(1);
			expect(first(result1.value.items).name).toBe("User1 Workspace");
			expect(result2.value.items).toHaveLength(1);
			expect(first(result2.value.items).name).toBe("User2 Workspace");
		}));

	// ── D. Sorting ─────────────────────────────────────────────────────

	test("Should sort by createdAt desc by default when sort is omitted", () =>
		runTestInTransaction(async (tx) => {
			const userId = await createUser(tx);

			const ws1 = await createTestWorkspace(tx, {
				name: "Oldest",
				createdAt: DATE_A,
				updatedAt: DATE_A,
			});
			const ws2 = await createTestWorkspace(tx, {
				name: "Middle",
				createdAt: DATE_B,
				updatedAt: DATE_B,
			});
			const ws3 = await createTestWorkspace(tx, {
				name: "Newest",
				createdAt: DATE_C,
				updatedAt: DATE_C,
			});
			await addMember(tx, { userId, workspaceId: ws1.id });
			await addMember(tx, { userId, workspaceId: ws2.id });
			await addMember(tx, { userId, workspaceId: ws3.id });

			const result = await getPaginatedWorkspaces({
				query: { userId, limit: 10 },
				dbClient: tx,
			});

			expect(result.isSuccess).toBe(true);
			expect(first(result.value.items).name).toBe("Newest");
			expect(result.value.items.length).toBeGreaterThan(1);
			expect(result.value.items[1]?.name).toBe("Middle");
			expect(result.value.items.length).toBeGreaterThan(2);
			expect(result.value.items[2]?.name).toBe("Oldest");
		}));

	test("Should sort by createdAt asc", () =>
		runTestInTransaction(async (tx) => {
			const userId = await createUser(tx);

			const ws1 = await createTestWorkspace(tx, {
				name: "Oldest",
				createdAt: DATE_A,
				updatedAt: DATE_A,
			});
			const ws2 = await createTestWorkspace(tx, {
				name: "Newest",
				createdAt: DATE_C,
				updatedAt: DATE_C,
			});
			await addMember(tx, { userId, workspaceId: ws1.id });
			await addMember(tx, { userId, workspaceId: ws2.id });

			const result = await getPaginatedWorkspaces({
				query: {
					userId,
					limit: 10,
					sort: { field: "createdAt", order: "asc" },
				},
				dbClient: tx,
			});

			expect(result.isSuccess).toBe(true);
			expect(first(result.value.items).name).toBe("Oldest");
			expect(result.value.items.length).toBeGreaterThan(1);
			expect(result.value.items[1]?.name).toBe("Newest");
		}));

	test("Should sort by updatedAt desc", () =>
		runTestInTransaction(async (tx) => {
			const userId = await createUser(tx);

			const ws1 = await createTestWorkspace(tx, {
				name: "Recently Updated",
				createdAt: DATE_A,
				updatedAt: DATE_C,
			});
			const ws2 = await createTestWorkspace(tx, {
				name: "Older Updated",
				createdAt: DATE_A,
				updatedAt: DATE_A,
			});
			await addMember(tx, { userId, workspaceId: ws1.id });
			await addMember(tx, { userId, workspaceId: ws2.id });

			const result = await getPaginatedWorkspaces({
				query: {
					userId,
					limit: 10,
					sort: { field: "updatedAt", order: "desc" },
				},
				dbClient: tx,
			});

			expect(result.isSuccess).toBe(true);
			expect(first(result.value.items).name).toBe("Recently Updated");
			expect(result.value.items.length).toBeGreaterThan(1);
			expect(result.value.items[1]?.name).toBe("Older Updated");
		}));

	// ── E. Cursor Pagination ───────────────────────────────────────────

	test("Should return hasNextPage=true when more items exist than limit", () =>
		runTestInTransaction(async (tx) => {
			const userId = await createUser(tx);

			const ws1 = await createTestWorkspace(tx, {
				name: "Workspace A",
				createdAt: DATE_A,
				updatedAt: DATE_A,
			});
			const ws2 = await createTestWorkspace(tx, {
				name: "Workspace B",
				createdAt: DATE_B,
				updatedAt: DATE_B,
			});
			const ws3 = await createTestWorkspace(tx, {
				name: "Workspace C",
				createdAt: DATE_C,
				updatedAt: DATE_C,
			});
			await addMember(tx, { userId, workspaceId: ws1.id });
			await addMember(tx, { userId, workspaceId: ws2.id });
			await addMember(tx, { userId, workspaceId: ws3.id });

			const result = await getPaginatedWorkspaces({
				query: { userId, limit: 2 },
				dbClient: tx,
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(2);
			expect(result.value.hasNextPage).toBe(true);
			expect(result.value.cursor).not.toBeNull();
			expect(first(result.value.items).name).toBe("Workspace C");
			expect(result.value.items[1]?.name).toBe("Workspace B");
		}));

	test("Should return second page via cursor", () =>
		runTestInTransaction(async (tx) => {
			const userId = await createUser(tx);

			const ws1 = await createTestWorkspace(tx, {
				name: "Workspace A",
				createdAt: DATE_A,
				updatedAt: DATE_A,
			});
			const ws2 = await createTestWorkspace(tx, {
				name: "Workspace B",
				createdAt: DATE_B,
				updatedAt: DATE_B,
			});
			const ws3 = await createTestWorkspace(tx, {
				name: "Workspace C",
				createdAt: DATE_C,
				updatedAt: DATE_C,
			});
			await addMember(tx, { userId, workspaceId: ws1.id });
			await addMember(tx, { userId, workspaceId: ws2.id });
			await addMember(tx, { userId, workspaceId: ws3.id });

			const page1 = await getPaginatedWorkspaces({
				query: { userId, limit: 2 },
				dbClient: tx,
			});

			expect(page1.isSuccess).toBe(true);
			expect(page1.value.hasNextPage).toBe(true);

			const page2 = await getPaginatedWorkspaces({
				query: { userId, limit: 2, cursor: page1.value.cursor },
				dbClient: tx,
			});

			expect(page2.isSuccess).toBe(true);
			expect(page2.value.items).toHaveLength(1);
			expect(first(page2.value.items).name).toBe("Workspace A");
			expect(page2.value.hasNextPage).toBe(false);
			expect(page2.value.cursor).toBeNull();
		}));

	test("Should return hasNextPage=false when items are within limit", () =>
		runTestInTransaction(async (tx) => {
			const userId = await createUser(tx);

			const ws1 = await createTestWorkspace(tx, {
				name: "Workspace A",
				createdAt: DATE_A,
				updatedAt: DATE_A,
			});
			const ws2 = await createTestWorkspace(tx, {
				name: "Workspace B",
				createdAt: DATE_B,
				updatedAt: DATE_B,
			});
			await addMember(tx, { userId, workspaceId: ws1.id });
			await addMember(tx, { userId, workspaceId: ws2.id });

			const result = await getPaginatedWorkspaces({
				query: { userId, limit: 5 },
				dbClient: tx,
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(2);
			expect(result.value.hasNextPage).toBe(false);
			expect(result.value.cursor).toBeNull();
		}));

	test("Should handle tie-breaking when workspaces have same createdAt but different IDs", () =>
		runTestInTransaction(async (tx) => {
			const userId = await createUser(tx);

			const fixedDate = new Date("2024-06-15T10:00:00.000Z");
			const ws1 = await createTestWorkspace(tx, {
				name: "Workspace AAA",
				createdAt: fixedDate,
				updatedAt: fixedDate,
				id: "00000000-0000-0000-0000-000000000001",
			});
			const ws2 = await createTestWorkspace(tx, {
				name: "Workspace BBB",
				createdAt: fixedDate,
				updatedAt: fixedDate,
				id: "00000000-0000-0000-0000-000000000002",
			});
			const ws3 = await createTestWorkspace(tx, {
				name: "Workspace CCC",
				createdAt: fixedDate,
				updatedAt: fixedDate,
				id: "00000000-0000-0000-0000-000000000003",
			});
			await addMember(tx, { userId, workspaceId: ws1.id });
			await addMember(tx, { userId, workspaceId: ws2.id });
			await addMember(tx, { userId, workspaceId: ws3.id });

			const page1 = await getPaginatedWorkspaces({
				query: { userId, limit: 2 },
				dbClient: tx,
			});

			expect(page1.isSuccess).toBe(true);
			expect(page1.value.items).toHaveLength(2);

			const page2 = await getPaginatedWorkspaces({
				query: { userId, limit: 2, cursor: page1.value.cursor },
				dbClient: tx,
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
		}));
});
