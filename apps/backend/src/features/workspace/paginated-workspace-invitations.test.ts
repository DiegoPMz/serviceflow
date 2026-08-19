import { describe, expect, test } from "bun:test";
import type { DatabaseClient } from "@serviceflow/backend/shared/database";
import { seedWorkspace } from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import type { SortDirection } from "@serviceflow/backend/shared/pagination";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { nanoid } from "nanoid";
import type {
	InvitationRole,
	WorkspaceInvitationStatus,
} from "./common/workspace-invitation.model";
import { WorkspaceInvitation } from "./common/workspace-invitation.model";
import { workspaceInvitationDrizzleRepository } from "./common/workspace-invitation-drizzle-repository";
import {
	getPaginatedWorkspaceInvitations,
	type WorkspaceInvitationOrderBy,
} from "./paginated-workspace-invitations";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function first<T>(arr: T[]): T {
	expect(arr.length).toBeGreaterThan(0);
	return arr[0] as T;
}

interface SeedInvitationOptions {
	email: string;
	createdAt: Date;
	status: WorkspaceInvitationStatus;
	role?: InvitationRole;
}

const seedInvitationAt = async (
	tx: DatabaseClient,
	workspaceId: string,
	{ email, createdAt, status, role = "viewer" }: SeedInvitationOptions,
): Promise<WorkspaceInvitation> => {
	const invitation = WorkspaceInvitation.reconstitute({
		token: nanoid(21),
		workspaceId,
		role,
		email,
		expiresAt: new Date(createdAt.getTime() + SEVEN_DAYS_MS),
		createdAt,
		expirationDays: 7,
		emailId: null,
		status,
		acceptedAt: status === "accepted" ? createdAt : null,
		cancelledAt: status === "cancelled" ? createdAt : null,
		rejectedAt: status === "rejected" ? createdAt : null,
	});

	await workspaceInvitationDrizzleRepository(tx).save(invitation);
	return invitation;
};

const runQuery = async (
	tx: DatabaseClient,
	workspaceId: string,
	paginationRequest: {
		limit: number;
		cursor?: string;
		orderBy?: WorkspaceInvitationOrderBy;
		direction?: SortDirection;
	},
) =>
	getPaginatedWorkspaceInvitations({
		query: {
			workspaceId,
			paginationRequest: {
				limit: paginationRequest.limit,
				cursor: paginationRequest.cursor,
				orderBy: paginationRequest.orderBy ?? "createdAt",
				direction: paginationRequest.direction ?? "desc",
			},
		},
		repository: workspaceInvitationDrizzleRepository(tx),
	});

describe("Paginated-Workspace-Invitations Integration Tests", () => {
	// ── A. Cursor Validation ─────────────────────────────────────────

	test("Should return PAGINATION_CURSOR_INVALID when cursor is corrupted", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx, { name: "Taller" });

			const result = await runQuery(tx, workspaceId, {
				limit: 10,
				cursor: "not-a-valid-cursor!!!",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("PAGINATION_CURSOR_INVALID");
		});
	});

	test("Should return PAGINATION_CURSOR_INVALID when cursor orderBy mismatches request", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx, { name: "Taller" });
			const invitation = await seedInvitationAt(tx, workspaceId, {
				email: "invitado@example.com",
				createdAt: new Date(),
				status: "pending",
			});

			const cursor = Buffer.from(
				JSON.stringify({
					orderBy: "createdAt",
					direction: "asc",
					value: invitation.createdAt.toISOString(),
					id: invitation.token,
				}),
			).toString("base64");

			const result = await runQuery(tx, workspaceId, {
				limit: 10,
				cursor,
				direction: "desc",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("PAGINATION_CURSOR_INVALID");
		});
	});

	// ── B. Empty / Isolation ────────────────────────────────────────

	test("Should return empty result when workspace has no invitations", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx, { name: "Taller" });

			const result = await runQuery(tx, workspaceId, { limit: 10 });

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(0);
			expect(result.value.hasNextPage).toBe(false);
			expect(result.value.cursor).toBeNull();
		});
	});

	test("Should only return invitations of the requested workspace and not others", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceA = await seedWorkspace(tx, { name: "Workspace A" });
			const workspaceB = await seedWorkspace(tx, { name: "Workspace B" });
			const now = Date.now();

			await seedInvitationAt(tx, workspaceA, {
				email: "a-uno@example.com",
				createdAt: new Date(now - 3 * 60 * 60 * 1000),
				status: "pending",
			});
			await seedInvitationAt(tx, workspaceA, {
				email: "a-dos@example.com",
				createdAt: new Date(now - 1 * 60 * 60 * 1000),
				status: "accepted",
			});
			await seedInvitationAt(tx, workspaceB, {
				email: "b-uno@example.com",
				createdAt: new Date(now - 2 * 60 * 60 * 1000),
				status: "pending",
			});
			await seedInvitationAt(tx, workspaceB, {
				email: "b-dos@example.com",
				createdAt: new Date(now - 4 * 60 * 60 * 1000),
				status: "rejected",
			});

			const result = await runQuery(tx, workspaceA, { limit: 10 });

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(2);
			expect(result.value.items.map((i) => i.email).sort()).toEqual([
				"a-dos@example.com",
				"a-uno@example.com",
			]);
			for (const item of result.value.items) {
				expect(item.email.startsWith("b-")).toBe(false);
			}
		});
	});

	// ── C. 30-day window ────────────────────────────────────────────

	test("Should not return invitations older than 30 days", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx, { name: "Taller" });

			await seedInvitationAt(tx, workspaceId, {
				email: "vieja@example.com",
				createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
				status: "pending",
			});
			await seedInvitationAt(tx, workspaceId, {
				email: "reciente@example.com",
				createdAt: new Date(Date.now() - 1000),
				status: "pending",
			});

			const result = await runQuery(tx, workspaceId, { limit: 10 });

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(first(result.value.items).email).toBe("reciente@example.com");
		});
	});

	test("Should include invitations exactly at the 30-day boundary", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx, { name: "Taller" });

			await seedInvitationAt(tx, workspaceId, {
				email: "limite@example.com",
				createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
				status: "pending",
			});

			const result = await runQuery(tx, workspaceId, { limit: 10 });

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(first(result.value.items).email).toBe("limite@example.com");
		});
	});

	// ── D. Status filter ────────────────────────────────────────────

	test("Should only return accepted, pending and rejected invitations (exclude cancelled)", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx, { name: "Taller" });

			await seedInvitationAt(tx, workspaceId, {
				email: "pendiente@example.com",
				createdAt: new Date(),
				status: "pending",
			});
			await seedInvitationAt(tx, workspaceId, {
				email: "aceptada@example.com",
				createdAt: new Date(),
				status: "accepted",
			});
			await seedInvitationAt(tx, workspaceId, {
				email: "rechazada@example.com",
				createdAt: new Date(),
				status: "rejected",
			});
			await seedInvitationAt(tx, workspaceId, {
				email: "cancelada@example.com",
				createdAt: new Date(),
				status: "cancelled",
			});

			const result = await runQuery(tx, workspaceId, { limit: 10 });

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(3);
			const statuses = result.value.items.map((i) => i.status).sort();
			expect(statuses).toEqual(["accepted", "pending", "rejected"]);
		});
	});

	// ── E. Sorting ──────────────────────────────────────────────────

	test("Should sort by createdAt desc (most recent first)", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx, { name: "Taller" });
			const now = Date.now();

			await seedInvitationAt(tx, workspaceId, {
				email: "vieja@example.com",
				createdAt: new Date(now - 3 * 60 * 60 * 1000),
				status: "pending",
			});
			await seedInvitationAt(tx, workspaceId, {
				email: "media@example.com",
				createdAt: new Date(now - 2 * 60 * 60 * 1000),
				status: "accepted",
			});
			await seedInvitationAt(tx, workspaceId, {
				email: "reciente@example.com",
				createdAt: new Date(now - 1 * 60 * 60 * 1000),
				status: "rejected",
			});

			const result = await runQuery(tx, workspaceId, { limit: 10 });

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((i) => i.email)).toEqual([
				"reciente@example.com",
				"media@example.com",
				"vieja@example.com",
			]);
		});
	});

	// ── F. Read-model shape ─────────────────────────────────────────

	test("Should return read-model with token, email, status and ISO issuedAt", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx, { name: "Taller" });
			const createdAt = new Date(Date.now() - 60 * 60 * 1000);
			const invitation = await seedInvitationAt(tx, workspaceId, {
				email: "invitado@example.com",
				createdAt,
				status: "pending",
			});

			const result = await runQuery(tx, workspaceId, { limit: 10 });

			expect(result.isSuccess).toBe(true);
			const item = first(result.value.items);
			expect(item.token).toBe(invitation.token);
			expect(item.email).toBe(invitation.email);
			expect(item.status).toBe("pending");
			expect(item.issuedAt).toBe(
				new Date(Math.floor(createdAt.getTime() / 1000) * 1000).toISOString(),
			);
			expect(new Date(item.issuedAt).toISOString()).toBe(item.issuedAt);
		});
	});

	// ── G. Cursor Pagination ────────────────────────────────────────

	test("Should set hasNextPage=true and a cursor when more items than limit", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx, { name: "Taller" });
			const now = Date.now();

			for (const [i, email] of [
				"uno@example.com",
				"dos@example.com",
				"tres@example.com",
			].entries()) {
				await seedInvitationAt(tx, workspaceId, {
					email,
					createdAt: new Date(now - (i + 1) * 60 * 60 * 1000),
					status: "pending",
				});
			}

			const result = await runQuery(tx, workspaceId, { limit: 2 });

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(2);
			expect(result.value.hasNextPage).toBe(true);
			expect(result.value.cursor).not.toBeNull();
			expect(result.value.items[0]?.email).toBe("uno@example.com");
			expect(result.value.items[1]?.email).toBe("dos@example.com");
		});
	});

	test("Should return the second page via cursor without duplicates or skips", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx, { name: "Taller" });
			const now = Date.now();

			for (const [i, email] of [
				"uno@example.com",
				"dos@example.com",
				"tres@example.com",
			].entries()) {
				await seedInvitationAt(tx, workspaceId, {
					email,
					createdAt: new Date(now - (i + 1) * 60 * 60 * 1000),
					status: "pending",
				});
			}

			const page1 = await runQuery(tx, workspaceId, { limit: 2 });

			expect(page1.isSuccess).toBe(true);
			expect(page1.value.hasNextPage).toBe(true);

			const page2 = await runQuery(tx, workspaceId, {
				limit: 2,
				cursor: page1.value.cursor ?? undefined,
			});

			expect(page2.isSuccess).toBe(true);
			expect(page2.value.items).toHaveLength(1);
			expect(first(page2.value.items).email).toBe("tres@example.com");
			expect(page2.value.hasNextPage).toBe(false);
			expect(page2.value.cursor).toBeNull();

			const allEmails = [
				...page1.value.items.map((i) => i.email),
				...page2.value.items.map((i) => i.email),
			].sort();
			expect(allEmails).toEqual(
				["dos@example.com", "tres@example.com", "uno@example.com"].sort(),
			);
		});
	});

	test("Should paginate without duplicates when createdAt ties on different tokens", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx, { name: "Taller" });
			const sameDate = new Date();

			for (const email of ["a@example.com", "b@example.com", "c@example.com"]) {
				await seedInvitationAt(tx, workspaceId, {
					email,
					createdAt: sameDate,
					status: "pending",
				});
			}

			const page1 = await runQuery(tx, workspaceId, { limit: 2 });

			expect(page1.isSuccess).toBe(true);
			expect(page1.value.items).toHaveLength(2);

			const page2 = await runQuery(tx, workspaceId, {
				limit: 2,
				cursor: page1.value.cursor ?? undefined,
			});

			expect(page2.isSuccess).toBe(true);
			expect(page2.value.items).toHaveLength(1);
			expect(page2.value.hasNextPage).toBe(false);

			const allEmails = [
				...page1.value.items.map((i) => i.email),
				...page2.value.items.map((i) => i.email),
			].sort();
			expect(allEmails).toEqual(
				["a@example.com", "b@example.com", "c@example.com"].sort(),
			);
		});
	});
});
