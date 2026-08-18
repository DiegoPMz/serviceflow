import { describe, expect, test } from "bun:test";
import type { DatabaseClient } from "@serviceflow/backend/shared/database";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import {
	addMember,
	seedWorkspace,
} from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import { first, runTestInTransaction } from "@serviceflow/backend/shared/tests";
import {
	WORKSPACE_ROLES,
	type WorkspaceRole,
} from "../workspace/common/workspace-member.model";
import { userDrizzleRepository } from "./common/user-drizzle-repository";
import { paginatedUserHandler } from "./paginated-users";

const seedWorkspaceUser = async (
	tx: DatabaseClient,
	workspaceId: string,
	overrides?: Parameters<typeof seedUser>[1],
	role: WorkspaceRole = WORKSPACE_ROLES.OWNER,
) => {
	const userId = await seedUser(tx, overrides);
	await addMember(tx, { userId, workspaceId, role });
	return userId;
};

describe("Paginated-Users Integration Tests", () => {
	// ── A. Cursor Validation ─────────────────────────────────────────

	test("Should return PAGINATION_CURSOR_INVALID when cursor is corrupted", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			const result = await paginatedUserHandler({
				query: {
					workspaceId,
					currentUserRoles: [WORKSPACE_ROLES.ADMIN],
					paginationRequest: {
						limit: 10,
						cursor: "not-a-valid-cursor!!!",
						orderBy: "name",
						direction: "asc",
					},
				},
				repository: userDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("PAGINATION_CURSOR_INVALID");
		});
	});

	test("Should return PAGINATION_CURSOR_INVALID when cursor orderBy mismatches request", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const userId = await seedWorkspaceUser(tx, workspaceId, {
				name: "Alpha",
			});

			const cursor = Buffer.from(
				JSON.stringify({
					orderBy: "updatedAt",
					direction: "asc",
					value: 1,
					id: userId,
				}),
			).toString("base64");

			const result = await paginatedUserHandler({
				query: {
					workspaceId,
					currentUserRoles: [WORKSPACE_ROLES.OWNER],
					paginationRequest: {
						limit: 10,
						cursor,
						orderBy: "name",
						direction: "asc",
					},
				},
				repository: userDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("PAGINATION_CURSOR_INVALID");
		});
	});

	// ── B. Empty / Isolation ────────────────────────────────────────

	test("Should return empty result when workspace has no members", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			const result = await paginatedUserHandler({
				query: {
					workspaceId,
					currentUserRoles: [WORKSPACE_ROLES.OWNER],
					paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
				},
				repository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(0);
			expect(result.value.hasNextPage).toBe(false);
			expect(result.value.cursor).toBeNull();
		});
	});

	test("Should not return users from another workspace", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const otherWorkspaceId = await seedWorkspace(tx);

			await seedWorkspaceUser(tx, workspaceId, { name: "Member User" });
			await seedWorkspaceUser(tx, otherWorkspaceId, { name: "Other User" });

			const result = await paginatedUserHandler({
				query: {
					workspaceId,
					currentUserRoles: [WORKSPACE_ROLES.OWNER],
					paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
				},
				repository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(first(result.value.items).name).toBe("Member User");
		});
	});

	// ── C. Sorting ──────────────────────────────────────────────────

	test("Should sort by name asc", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			for (const name of ["Charlie", "Alpha", "Bravo"]) {
				await seedWorkspaceUser(tx, workspaceId, { name });
			}

			const result = await paginatedUserHandler({
				query: {
					workspaceId,
					currentUserRoles: [WORKSPACE_ROLES.OWNER],
					paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
				},
				repository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((u) => u.name)).toEqual([
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
				await seedWorkspaceUser(tx, workspaceId, { name });
			}

			const result = await paginatedUserHandler({
				query: {
					workspaceId,
					currentUserRoles: [WORKSPACE_ROLES.OWNER],
					paginationRequest: { limit: 10, orderBy: "name", direction: "desc" },
				},
				repository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((u) => u.name)).toEqual([
				"Charlie",
				"Bravo",
				"Alpha",
			]);
		});
	});

	test("Should sort by createdAt desc by default", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			await seedWorkspaceUser(tx, workspaceId, {
				name: "Oldest",
				createdAt: new Date("2024-01-01T00:00:00.000Z"),
				updatedAt: new Date("2024-01-01T00:00:00.000Z"),
			});
			await seedWorkspaceUser(tx, workspaceId, {
				name: "Middle",
				createdAt: new Date("2024-02-01T00:00:00.000Z"),
				updatedAt: new Date("2024-02-01T00:00:00.000Z"),
			});
			await seedWorkspaceUser(tx, workspaceId, {
				name: "Newest",
				createdAt: new Date("2024-03-01T00:00:00.000Z"),
				updatedAt: new Date("2024-03-01T00:00:00.000Z"),
			});

			const result = await paginatedUserHandler({
				query: {
					workspaceId,
					currentUserRoles: [WORKSPACE_ROLES.OWNER],
					paginationRequest: {
						limit: 10,
						orderBy: "createdAt",
						direction: "desc",
					},
				},
				repository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((u) => u.name)).toEqual([
				"Newest",
				"Middle",
				"Oldest",
			]);
		});
	});

	test("Should sort by createdAt asc", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			await seedWorkspaceUser(tx, workspaceId, {
				name: "Oldest",
				createdAt: new Date("2024-01-01T00:00:00.000Z"),
				updatedAt: new Date("2024-01-01T00:00:00.000Z"),
			});
			await seedWorkspaceUser(tx, workspaceId, {
				name: "Newest",
				createdAt: new Date("2024-03-01T00:00:00.000Z"),
				updatedAt: new Date("2024-03-01T00:00:00.000Z"),
			});

			const result = await paginatedUserHandler({
				query: {
					workspaceId,
					currentUserRoles: [WORKSPACE_ROLES.OWNER],
					paginationRequest: {
						limit: 10,
						orderBy: "createdAt",
						direction: "asc",
					},
				},
				repository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((u) => u.name)).toEqual([
				"Oldest",
				"Newest",
			]);
		});
	});

	test("Should sort by id asc", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			const user1 = await seedWorkspaceUser(tx, workspaceId, {
				name: "User1",
				id: "00000000000000000000000001",
			});
			const user2 = await seedWorkspaceUser(tx, workspaceId, {
				name: "User2",
				id: "00000000000000000000000002",
			});
			const user3 = await seedWorkspaceUser(tx, workspaceId, {
				name: "User3",
				id: "00000000000000000000000003",
			});

			const result = await paginatedUserHandler({
				query: {
					workspaceId,
					currentUserRoles: [WORKSPACE_ROLES.OWNER],
					paginationRequest: { limit: 10, orderBy: "id", direction: "asc" },
				},
				repository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((u) => u.id)).toEqual([
				user1,
				user2,
				user3,
			]);
		});
	});

	// ── D. Search ────────────────────────────────────────────────────

	test("Should filter by search on name", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			await seedWorkspaceUser(tx, workspaceId, {
				name: "Juan",
				lastName: "Perez",
			});
			await seedWorkspaceUser(tx, workspaceId, {
				name: "Maria",
				lastName: "Lopez",
			});

			const result = await paginatedUserHandler({
				query: {
					workspaceId,
					currentUserRoles: [WORKSPACE_ROLES.OWNER],
					paginationRequest: {
						limit: 10,
						orderBy: "name",
						direction: "asc",
						search: "Juan",
					},
				},
				repository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(first(result.value.items).name).toBe("Juan");
		});
	});

	test("Should filter by search on email", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			const juanId = await seedWorkspaceUser(tx, workspaceId, {
				name: "Juan",
				email: "juan@example.com",
			});
			await seedWorkspaceUser(tx, workspaceId, {
				name: "Maria",
				email: "maria@example.com",
			});

			const result = await paginatedUserHandler({
				query: {
					workspaceId,
					currentUserRoles: [WORKSPACE_ROLES.OWNER],
					paginationRequest: {
						limit: 10,
						orderBy: "name",
						direction: "asc",
						search: "juan@example.com",
					},
				},
				repository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(first(result.value.items).id).toBe(juanId);
		});
	});

	test("Should return empty when search has no matches", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			await seedWorkspaceUser(tx, workspaceId, { name: "Juan" });

			const result = await paginatedUserHandler({
				query: {
					workspaceId,
					currentUserRoles: [WORKSPACE_ROLES.OWNER],
					paginationRequest: {
						limit: 10,
						orderBy: "name",
						direction: "asc",
						search: "NoExiste",
					},
				},
				repository: userDrizzleRepository(tx),
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
				await seedWorkspaceUser(tx, workspaceId, { name });
			}

			const result = await paginatedUserHandler({
				query: {
					workspaceId,
					currentUserRoles: [WORKSPACE_ROLES.OWNER],
					paginationRequest: { limit: 2, orderBy: "name", direction: "asc" },
				},
				repository: userDrizzleRepository(tx),
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
				await seedWorkspaceUser(tx, workspaceId, { name });
			}

			const page1 = await paginatedUserHandler({
				query: {
					workspaceId,
					currentUserRoles: [WORKSPACE_ROLES.OWNER],
					paginationRequest: { limit: 2, orderBy: "name", direction: "asc" },
				},
				repository: userDrizzleRepository(tx),
			});

			expect(page1.isSuccess).toBe(true);
			expect(page1.value.hasNextPage).toBe(true);

			const page2 = await paginatedUserHandler({
				query: {
					workspaceId,
					currentUserRoles: [WORKSPACE_ROLES.OWNER],
					paginationRequest: {
						limit: 2,
						orderBy: "name",
						direction: "asc",
						cursor: page1.value.cursor ?? undefined,
					},
				},
				repository: userDrizzleRepository(tx),
			});

			expect(page2.isSuccess).toBe(true);
			expect(page2.value.items).toHaveLength(1);
			expect(first(page2.value.items).name).toBe("Charlie");
			expect(page2.value.hasNextPage).toBe(false);
			expect(page2.value.cursor).toBeNull();
		});
	});

	test("Should paginate by createdAt without duplicates or skips", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			const dates = [
				new Date("2024-01-01T00:00:00.000Z"),
				new Date("2024-02-01T00:00:00.000Z"),
				new Date("2024-03-01T00:00:00.000Z"),
			];

			for (const [index, date] of dates.entries()) {
				await seedWorkspaceUser(tx, workspaceId, {
					name: `User-${index + 1}`,
					createdAt: date,
					updatedAt: date,
				});
			}

			const page1 = await paginatedUserHandler({
				query: {
					workspaceId,
					currentUserRoles: [WORKSPACE_ROLES.OWNER],
					paginationRequest: {
						limit: 2,
						orderBy: "createdAt",
						direction: "desc",
					},
				},
				repository: userDrizzleRepository(tx),
			});

			expect(page1.isSuccess).toBe(true);
			expect(page1.value.items).toHaveLength(2);
			expect(page1.value.hasNextPage).toBe(true);

			const page2 = await paginatedUserHandler({
				query: {
					workspaceId,
					currentUserRoles: [WORKSPACE_ROLES.OWNER],
					paginationRequest: {
						limit: 2,
						orderBy: "createdAt",
						direction: "desc",
						cursor: page1.value.cursor ?? undefined,
					},
				},
				repository: userDrizzleRepository(tx),
			});

			expect(page2.isSuccess).toBe(true);
			expect(page2.value.items).toHaveLength(1);
			expect(page2.value.hasNextPage).toBe(false);

			expect([
				...page1.value.items.map((u) => u.name),
				...page2.value.items.map((u) => u.name),
			]).toEqual(["User-3", "User-2", "User-1"]);
		});
	});

	test("Should paginate without duplicates or skips on tie-breaking by id", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			const ids = [
				"00000000000000000000000001",
				"00000000000000000000000002",
				"00000000000000000000000003",
			];

			for (const id of ids) {
				await seedWorkspaceUser(tx, workspaceId, { name: "Same", id });
			}

			const page1 = await paginatedUserHandler({
				query: {
					workspaceId,
					currentUserRoles: [WORKSPACE_ROLES.OWNER],
					paginationRequest: { limit: 2, orderBy: "name", direction: "asc" },
				},
				repository: userDrizzleRepository(tx),
			});

			expect(page1.isSuccess).toBe(true);
			expect(page1.value.items).toHaveLength(2);

			const page2 = await paginatedUserHandler({
				query: {
					workspaceId,
					currentUserRoles: [WORKSPACE_ROLES.OWNER],
					paginationRequest: {
						limit: 2,
						orderBy: "name",
						direction: "asc",
						cursor: page1.value.cursor ?? undefined,
					},
				},
				repository: userDrizzleRepository(tx),
			});

			expect(page2.isSuccess).toBe(true);
			expect(page2.value.items).toHaveLength(1);
			expect(page2.value.hasNextPage).toBe(false);

			const allIds = [
				...page1.value.items.map((u) => u.id),
				...page2.value.items.map((u) => u.id),
			].sort();
			expect(allIds).toEqual(ids);
		});
	});

	// ── F. Read Model ───────────────────────────────────────────────

	test("Should expose the user details fields", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			await seedWorkspaceUser(
				tx,
				workspaceId,
				{
					name: "Juan",
					lastName: "Perez",
					email: "juan@example.com",
					pictureUrl: "https://example.com/photo.jpg",
					phone: "+5215500000001",
				},
				WORKSPACE_ROLES.TECHNICIAN,
			);

			const result = await paginatedUserHandler({
				query: {
					workspaceId,
					currentUserRoles: [WORKSPACE_ROLES.OWNER],
					paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
				},
				repository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			const user = first(result.value.items);
			expect(user).toEqual({
				id: user.id,
				email: "juan@example.com",
				name: "Juan",
				lastName: "Perez",
				pictureUrl: "https://example.com/photo.jpg",
				phone: "+5215500000001",
				role: "technician",
			});
		});
	});

	// ── G. Role Visibility ─────────────────────────────────────────

	test("Should include the role of each user when current user is owner", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			await seedWorkspaceUser(
				tx,
				workspaceId,
				{ name: "Ana" },
				WORKSPACE_ROLES.OWNER,
			);
			await seedWorkspaceUser(
				tx,
				workspaceId,
				{ name: "Bea" },
				WORKSPACE_ROLES.ADMIN,
			);
			await seedWorkspaceUser(
				tx,
				workspaceId,
				{ name: "Cris" },
				WORKSPACE_ROLES.TECHNICIAN,
			);
			await seedWorkspaceUser(
				tx,
				workspaceId,
				{ name: "Dani" },
				WORKSPACE_ROLES.VIEWER,
			);

			const result = await paginatedUserHandler({
				query: {
					workspaceId,
					currentUserRoles: [WORKSPACE_ROLES.OWNER],
					paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
				},
				repository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((u) => [u.name, u.role])).toEqual([
				["Ana", "owner"],
				["Bea", "admin"],
				["Cris", "technician"],
				["Dani", "viewer"],
			]);
		});
	});

	test("Should include the role of each user when current user is admin", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			await seedWorkspaceUser(
				tx,
				workspaceId,
				{ name: "Ana" },
				WORKSPACE_ROLES.OWNER,
			);
			await seedWorkspaceUser(
				tx,
				workspaceId,
				{ name: "Bea" },
				WORKSPACE_ROLES.ADMIN,
			);

			const result = await paginatedUserHandler({
				query: {
					workspaceId,
					currentUserRoles: [WORKSPACE_ROLES.ADMIN],
					paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
				},
				repository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((u) => [u.name, u.role])).toEqual([
				["Ana", "owner"],
				["Bea", "admin"],
			]);
		});
	});

	test("Should hide the role of each user when current user is a technician", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			await seedWorkspaceUser(
				tx,
				workspaceId,
				{ name: "Ana" },
				WORKSPACE_ROLES.OWNER,
			);
			await seedWorkspaceUser(
				tx,
				workspaceId,
				{ name: "Bea" },
				WORKSPACE_ROLES.ADMIN,
			);

			const result = await paginatedUserHandler({
				query: {
					workspaceId,
					currentUserRoles: [WORKSPACE_ROLES.TECHNICIAN],
					paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
				},
				repository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			for (const user of result.value.items) {
				expect(user.role).toBeUndefined();
				expect(user.name).toBeDefined();
				expect(user.email).toBeDefined();
			}
		});
	});

	test("Should hide the role of each user when current user is a viewer", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			await seedWorkspaceUser(
				tx,
				workspaceId,
				{ name: "Ana" },
				WORKSPACE_ROLES.OWNER,
			);
			await seedWorkspaceUser(
				tx,
				workspaceId,
				{ name: "Bea" },
				WORKSPACE_ROLES.TECHNICIAN,
			);

			const result = await paginatedUserHandler({
				query: {
					workspaceId,
					currentUserRoles: [WORKSPACE_ROLES.VIEWER],
					paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
				},
				repository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			for (const user of result.value.items) {
				expect(user.role).toBeUndefined();
				expect(user.name).toBeDefined();
				expect(user.email).toBeDefined();
			}
		});
	});

	test("Should include roles when current user has owner among multiple roles", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			await seedWorkspaceUser(
				tx,
				workspaceId,
				{ name: "Ana" },
				WORKSPACE_ROLES.OWNER,
			);

			const result = await paginatedUserHandler({
				query: {
					workspaceId,
					currentUserRoles: [WORKSPACE_ROLES.VIEWER, WORKSPACE_ROLES.OWNER],
					paginationRequest: { limit: 10, orderBy: "name", direction: "asc" },
				},
				repository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(first(result.value.items).role).toBe("owner");
		});
	});
});
