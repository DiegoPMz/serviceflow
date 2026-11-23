import { describe, expect, test } from "bun:test";
import type { DatabaseClient } from "@serviceflow/backend/shared/database";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import {
	addMember,
	seedWorkspace,
} from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import type { SortDirection } from "@serviceflow/backend/shared/pagination";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { workspaceAuthorization } from "./common/workspace-authorization";
import { workspaceMemberDrizzleRepository } from "./common/workspace-drizzle-member-repository";
import type { WorkspaceRole } from "./common/workspace-member.model";
import {
	getPaginatedWorkspaceMembers,
	type WorkspaceMemberOrderBy,
} from "./paginated-workspace-members";

function first<T>(arr: T[]): T {
	expect(arr.length).toBeGreaterThan(0);
	return arr[0] as T;
}

interface SeedMemberOptions {
	workspaceId: string;
	role?: WorkspaceRole;
	name?: string;
	lastName?: string;
	email?: string;
	joinedAt?: Date;
	pictureUrl?: string | null;
}

const seedMember = async (
	tx: DatabaseClient,
	{
		workspaceId,
		role = "viewer",
		name = "Test User",
		lastName = "Perez",
		email,
		joinedAt,
		pictureUrl = null,
	}: SeedMemberOptions,
): Promise<string> => {
	const userId = await seedUser(tx, {
		name,
		lastName,
		email,
		pictureUrl,
	});

	await addMember(tx, { workspaceId, userId, role, joinedAt });
	return userId;
};

const runQuery = async (
	tx: DatabaseClient,
	{
		workspaceId,
		requesterUserId,
		limit,
		cursor,
		orderBy,
		direction,
		search,
	}: {
		workspaceId: string;
		requesterUserId: string;
		limit: number;
		cursor?: string;
		orderBy?: WorkspaceMemberOrderBy;
		direction?: SortDirection;
		search?: string;
	},
) => {
	const repository = workspaceMemberDrizzleRepository(tx);

	return getPaginatedWorkspaceMembers({
		query: {
			workspaceId,
			requesterUserId,
			paginationRequest: {
				limit,
				cursor,
				orderBy: orderBy ?? "joinedAt",
				direction: direction ?? "desc",
				search,
			},
		},
		repository,
		authorization: workspaceAuthorization({ membersRepository: repository }),
	});
};

const seconds = (date: Date): Date =>
	new Date(Math.floor(date.getTime() / 1000) * 1000);

describe("Paginated-Workspace-Members Integration Tests", () => {
	// ── A. Authorization / workspace isolation ──────────────────────

	test("Should reject a user that does not belong to the workspace", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx, { name: "Taller" });
			const outsiderId = await seedUser(tx, { email: "outsider@test.com" });

			const result = await runQuery(tx, {
				workspaceId,
				requesterUserId: outsiderId,
				limit: 10,
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("NOT_A_MEMBER");
		});
	});

	test("Should reject an admin of another workspace listing this workspace members", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceA = await seedWorkspace(tx, { name: "Workspace A" });
			const workspaceB = await seedWorkspace(tx, { name: "Workspace B" });
			const adminOfB = await seedMember(tx, {
				workspaceId: workspaceB,
				role: "admin",
				email: "admin-b@test.com",
			});

			await seedMember(tx, {
				workspaceId: workspaceA,
				role: "viewer",
				email: "viewer-a@test.com",
			});

			const result = await runQuery(tx, {
				workspaceId: workspaceA,
				requesterUserId: adminOfB,
				limit: 10,
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("NOT_A_MEMBER");
		});
	});

	test("Should allow every workspace role to list members", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx, { name: "Taller" });
			const roles: WorkspaceRole[] = ["owner", "admin", "technician", "viewer"];

			for (const role of roles) {
				const requesterId = await seedMember(tx, {
					workspaceId,
					role,
					email: `${role}@test.com`,
				});

				const result = await runQuery(tx, {
					workspaceId,
					requesterUserId: requesterId,
					limit: 10,
				});

				expect(result.isSuccess).toBe(true);
				expect(result.value.items).toHaveLength(roles.indexOf(role) + 1);
			}
		});
	});

	test("Should only return members of the requested workspace", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceA = await seedWorkspace(tx, { name: "Workspace A" });
			const workspaceB = await seedWorkspace(tx, { name: "Workspace B" });

			const requesterId = await seedMember(tx, {
				workspaceId: workspaceA,
				role: "owner",
				email: "owner-a@test.com",
			});
			await seedMember(tx, {
				workspaceId: workspaceA,
				role: "viewer",
				email: "viewer-a@test.com",
			});
			await seedMember(tx, {
				workspaceId: workspaceB,
				role: "owner",
				email: "owner-b@test.com",
			});

			const result = await runQuery(tx, {
				workspaceId: workspaceA,
				requesterUserId: requesterId,
				limit: 10,
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(2);
			for (const member of result.value.items) {
				expect(member.email.endsWith("-a@test.com")).toBe(true);
			}
		});
	});

	// ── B. Cursor validation ────────────────────────────────────────

	test("Should return PAGINATION_CURSOR_INVALID when cursor is corrupted", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx, { name: "Taller" });
			const requesterId = await seedMember(tx, {
				workspaceId,
				role: "owner",
				email: "owner@test.com",
			});

			const result = await runQuery(tx, {
				workspaceId,
				requesterUserId: requesterId,
				limit: 10,
				cursor: "not-a-valid-cursor!!!",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("PAGINATION_CURSOR_INVALID");
		});
	});

	test("Should return PAGINATION_CURSOR_INVALID when orderBy mismatches the cursor", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx, { name: "Taller" });
			const requesterId = await seedMember(tx, {
				workspaceId,
				role: "owner",
				email: "owner@test.com",
			});

			const cursor = Buffer.from(
				JSON.stringify({
					workspaceId,
					orderBy: "joinedAt",
					direction: "desc",
					value: Date.now(),
					id: requesterId,
				}),
			).toString("base64");

			const result = await runQuery(tx, {
				workspaceId,
				requesterUserId: requesterId,
				limit: 10,
				cursor,
				orderBy: "name",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("PAGINATION_CURSOR_INVALID");
		});
	});

	test("Should reject a cursor created for another workspace", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceA = await seedWorkspace(tx, { name: "Workspace A" });
			const workspaceB = await seedWorkspace(tx, { name: "Workspace B" });

			const ownerA = await seedMember(tx, {
				workspaceId: workspaceA,
				role: "owner",
				email: "owner-a@test.com",
			});
			await seedMember(tx, {
				workspaceId: workspaceA,
				role: "viewer",
				email: "viewer-a@test.com",
			});

			const ownerB = await seedMember(tx, {
				workspaceId: workspaceB,
				role: "owner",
				email: "owner-b@test.com",
			});
			await seedMember(tx, {
				workspaceId: workspaceB,
				role: "viewer",
				email: "viewer-b@test.com",
			});

			const pageFromA = await runQuery(tx, {
				workspaceId: workspaceA,
				requesterUserId: ownerA,
				limit: 1,
			});

			expect(pageFromA.isSuccess).toBe(true);
			expect(pageFromA.value.cursor).not.toBeNull();

			const result = await runQuery(tx, {
				workspaceId: workspaceB,
				requesterUserId: ownerB,
				limit: 1,
				cursor: pageFromA.value.cursor ?? undefined,
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("PAGINATION_CURSOR_INVALID");
		});
	});

	// ── C. Read model ───────────────────────────────────────────────

	test("Should return the full read model including role and joinedAt", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx, { name: "Taller" });
			const joinedAt = seconds(new Date(Date.now() - 60 * 60 * 1000));

			const userId = await seedMember(tx, {
				workspaceId,
				role: "technician",
				name: "Ana",
				lastName: "López",
				email: "ana@test.com",
				joinedAt,
				pictureUrl: "https://example.com/ana.jpg",
			});
			await seedMember(tx, {
				workspaceId,
				role: "owner",
				email: "owner@test.com",
				joinedAt: new Date(),
			});

			const result = await runQuery(tx, {
				workspaceId,
				requesterUserId: userId,
				limit: 10,
			});

			expect(result.isSuccess).toBe(true);

			const member = result.value.items.find((item) => item.userId === userId);
			expect(member).toEqual({
				userId,
				name: "Ana",
				lastName: "López",
				email: "ana@test.com",
				pictureUrl: "https://example.com/ana.jpg",
				role: "technician",
				joinedAt: joinedAt.toISOString(),
			});
		});
	});

	test("Should fall back to a seconds-based joinedAt default when it is not provided", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx, { name: "Taller" });

			// No joinedAt: the SQL column default is the only source of truth here.
			const userId = await seedMember(tx, {
				workspaceId,
				role: "owner",
				email: "owner-default@test.com",
			});

			const result = await runQuery(tx, {
				workspaceId,
				requesterUserId: userId,
				limit: 10,
			});

			expect(result.isSuccess).toBe(true);

			const member = result.value.items.find((item) => item.userId === userId);
			expect(member).toBeDefined();

			const joinedAt = new Date(member?.joinedAt ?? "");

			expect(Number.isNaN(joinedAt.getTime())).toBe(false);
			expect(joinedAt.getFullYear()).toBeGreaterThan(2020);
			expect(joinedAt.getTime()).toBeLessThanOrEqual(Date.now() + 60_000);
		});
	});

	// ── D. Sorting / search ─────────────────────────────────────────

	test("Should sort by joinedAt desc by default", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx, { name: "Taller" });
			const now = Date.now();

			const ownerId = await seedMember(tx, {
				workspaceId,
				role: "owner",
				email: "owner@test.com",
				joinedAt: new Date(now - 3 * 60 * 60 * 1000),
			});
			await seedMember(tx, {
				workspaceId,
				role: "admin",
				email: "admin@test.com",
				joinedAt: new Date(now - 2 * 60 * 60 * 1000),
			});
			await seedMember(tx, {
				workspaceId,
				role: "viewer",
				email: "viewer@test.com",
				joinedAt: new Date(now - 1 * 60 * 60 * 1000),
			});

			const result = await runQuery(tx, {
				workspaceId,
				requesterUserId: ownerId,
				limit: 10,
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((member) => member.email)).toEqual([
				"viewer@test.com",
				"admin@test.com",
				"owner@test.com",
			]);
		});
	});

	test("Should sort by name asc when requested", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx, { name: "Taller" });

			const ownerId = await seedMember(tx, {
				workspaceId,
				role: "owner",
				name: "Zoe",
				email: "zoe@test.com",
			});
			await seedMember(tx, {
				workspaceId,
				role: "viewer",
				name: "Ana",
				email: "ana@test.com",
			});
			await seedMember(tx, {
				workspaceId,
				role: "viewer",
				name: "Mike",
				email: "mike@test.com",
			});

			const result = await runQuery(tx, {
				workspaceId,
				requesterUserId: ownerId,
				limit: 10,
				orderBy: "name",
				direction: "asc",
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((member) => member.name)).toEqual([
				"Ana",
				"Mike",
				"Zoe",
			]);
		});
	});

	test("Should search by name, lastName and email", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx, { name: "Taller" });

			const ownerId = await seedMember(tx, {
				workspaceId,
				role: "owner",
				name: "Owner",
				lastName: "Root",
				email: "owner@test.com",
			});
			await seedMember(tx, {
				workspaceId,
				role: "technician",
				name: "Juan",
				lastName: "Pérez",
				email: "juan.perez@test.com",
			});
			await seedMember(tx, {
				workspaceId,
				role: "viewer",
				name: "María",
				lastName: "Gómez",
				email: "maria@test.com",
			});

			const byName = await runQuery(tx, {
				workspaceId,
				requesterUserId: ownerId,
				limit: 10,
				search: "Juan",
			});
			expect(byName.isSuccess).toBe(true);
			expect(byName.value.items.map((member) => member.email)).toEqual([
				"juan.perez@test.com",
			]);

			const byLastName = await runQuery(tx, {
				workspaceId,
				requesterUserId: ownerId,
				limit: 10,
				search: "Gómez",
			});
			expect(byLastName.isSuccess).toBe(true);
			expect(byLastName.value.items.map((member) => member.email)).toEqual([
				"maria@test.com",
			]);

			const byEmail = await runQuery(tx, {
				workspaceId,
				requesterUserId: ownerId,
				limit: 10,
				search: "maria@",
			});
			expect(byEmail.isSuccess).toBe(true);
			expect(byEmail.value.items.map((member) => member.email)).toEqual([
				"maria@test.com",
			]);
		});
	});

	// ── E. Cursor pagination ────────────────────────────────────────

	test("Should paginate without duplicates or skips", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx, { name: "Taller" });
			const now = Date.now();

			const emails = ["uno@test.com", "dos@test.com", "tres@test.com"];

			let ownerId = "";
			for (const [index, email] of emails.entries()) {
				const userId = await seedMember(tx, {
					workspaceId,
					role: index === 0 ? "owner" : "viewer",
					email,
					joinedAt: new Date(now - (index + 1) * 60 * 60 * 1000),
				});
				if (index === 0) ownerId = userId;
			}

			const page1 = await runQuery(tx, {
				workspaceId,
				requesterUserId: ownerId,
				limit: 2,
			});

			expect(page1.isSuccess).toBe(true);
			expect(page1.value.items).toHaveLength(2);
			expect(page1.value.hasNextPage).toBe(true);

			const page2 = await runQuery(tx, {
				workspaceId,
				requesterUserId: ownerId,
				limit: 2,
				cursor: page1.value.cursor ?? undefined,
			});

			expect(page2.isSuccess).toBe(true);
			expect(page2.value.items).toHaveLength(1);
			expect(page2.value.hasNextPage).toBe(false);

			const allEmails = [
				...page1.value.items.map((member) => member.email),
				...page2.value.items.map((member) => member.email),
			];
			expect(allEmails).toHaveLength(3);
			expect(new Set(allEmails).size).toBe(3);
			expect(allEmails.sort()).toEqual([...emails].sort());
		});
	});

	test("Should paginate without duplicates when joinedAt ties", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx, { name: "Taller" });
			const sameDate = seconds(new Date());

			const emails = ["a@test.com", "b@test.com", "c@test.com"];
			let ownerId = "";

			for (const [index, email] of emails.entries()) {
				const userId = await seedMember(tx, {
					workspaceId,
					role: index === 0 ? "owner" : "viewer",
					email,
					joinedAt: sameDate,
				});
				if (index === 0) ownerId = userId;
			}

			const page1 = await runQuery(tx, {
				workspaceId,
				requesterUserId: ownerId,
				limit: 2,
			});
			expect(page1.isSuccess).toBe(true);
			expect(page1.value.items).toHaveLength(2);

			const page2 = await runQuery(tx, {
				workspaceId,
				requesterUserId: ownerId,
				limit: 2,
				cursor: page1.value.cursor ?? undefined,
			});
			expect(page2.isSuccess).toBe(true);
			expect(page2.value.items).toHaveLength(1);

			const allEmails = [
				...page1.value.items.map((member) => member.email),
				...page2.value.items.map((member) => member.email),
			];
			expect(new Set(allEmails).size).toBe(3);
			expect(allEmails.sort()).toEqual([...emails].sort());
			expect(first(page2.value.items).email).toBeDefined();
		});
	});
});
