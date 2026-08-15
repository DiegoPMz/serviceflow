import { describe, expect, test } from "bun:test";
import type {
	DatabaseClient,
	orders,
} from "@serviceflow/backend/shared/database";
import { seedClient } from "@serviceflow/backend/shared/database/seeds/client.seeds";
import { seedDevice } from "@serviceflow/backend/shared/database/seeds/device.seeds";
import { seedOrder } from "@serviceflow/backend/shared/database/seeds/order.seeds";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import {
	addMember,
	seedWorkspace,
} from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import { first, runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { OrderDrizzleRepository } from "./common/order-drizzle-repository";
import { paginatedOrderHandler } from "./paginated-orders";

interface OrderSeedBase {
	userId: string;
	workspaceId: string;
	clientId: string;
	deviceId: string;
}

const seedBase = async (tx: DatabaseClient) => {
	const userId = await seedUser(tx, {
		pictureUrl: "https://example.com/avatar.png",
	});
	const workspaceId = await seedWorkspace(tx);
	await addMember(tx, { userId, workspaceId });
	const clientId = (await seedClient(tx, { workspaceId })).id;
	const deviceId = (await seedDevice(tx, { workspaceId, clientId })).id;
	return { userId, workspaceId, clientId, deviceId };
};

const seedOrderFor = async (
	tx: DatabaseClient,
	base: OrderSeedBase,
	overrides?: Partial<typeof orders.$inferInsert>,
) =>
	seedOrder(tx, {
		workspaceId: base.workspaceId,
		clientId: base.clientId,
		deviceId: base.deviceId,
		userId: base.userId,
		...overrides,
	});

describe("Paginated-Orders Integration Tests", () => {
	// ── A. Cursor Validation ─────────────────────────────────────────

	test("Should return PAGINATION_CURSOR_INVALID when cursor is corrupted", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			const result = await paginatedOrderHandler({
				query: {
					workspaceId: base.workspaceId,
					paginationRequest: {
						limit: 10,
						cursor: "not-a-valid-cursor!!!",
						orderBy: "folio",
						direction: "asc",
					},
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("PAGINATION_CURSOR_INVALID");
		});
	});

	test("Should return PAGINATION_CURSOR_INVALID when cursor orderBy mismatches request", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);
			const orderId = await seedOrderFor(tx, base, { folio: "TEST1" });

			const cursor = Buffer.from(
				JSON.stringify({
					orderBy: "createdAt",
					direction: "asc",
					value: 1,
					id: orderId,
				}),
			).toString("base64");

			const result = await paginatedOrderHandler({
				query: {
					workspaceId: base.workspaceId,
					paginationRequest: {
						limit: 10,
						cursor,
						orderBy: "folio",
						direction: "asc",
					},
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("PAGINATION_CURSOR_INVALID");
		});
	});

	// ── B. Empty / Isolation ────────────────────────────────────────

	test("Should return empty result when workspace has no orders", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			const result = await paginatedOrderHandler({
				query: {
					workspaceId: base.workspaceId,
					paginationRequest: { limit: 10, orderBy: "folio", direction: "asc" },
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(0);
			expect(result.value.hasNextPage).toBe(false);
			expect(result.value.cursor).toBeNull();
		});
	});

	test("Should not return orders from another workspace", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);
			const otherBase = await seedBase(tx);

			await seedOrderFor(tx, base, { folio: "WS1-1" });
			await seedOrderFor(tx, otherBase, { folio: "WS2-1" });

			const result = await paginatedOrderHandler({
				query: {
					workspaceId: base.workspaceId,
					paginationRequest: { limit: 10, orderBy: "folio", direction: "asc" },
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(first(result.value.items).folio).toBe("WS1-1");
		});
	});

	// ── C. Sorting ──────────────────────────────────────────────────

	test("Should sort by folio asc", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			for (const folio of ["ORD-3", "ORD-1", "ORD-2"]) {
				await seedOrderFor(tx, base, { folio });
			}

			const result = await paginatedOrderHandler({
				query: {
					workspaceId: base.workspaceId,
					paginationRequest: { limit: 10, orderBy: "folio", direction: "asc" },
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((o) => o.folio)).toEqual([
				"ORD-1",
				"ORD-2",
				"ORD-3",
			]);
		});
	});

	test("Should sort by folio desc", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			for (const folio of ["ORD-1", "ORD-3", "ORD-2"]) {
				await seedOrderFor(tx, base, { folio });
			}

			const result = await paginatedOrderHandler({
				query: {
					workspaceId: base.workspaceId,
					paginationRequest: { limit: 10, orderBy: "folio", direction: "desc" },
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((o) => o.folio)).toEqual([
				"ORD-3",
				"ORD-2",
				"ORD-1",
			]);
		});
	});

	test("Should sort by createdAt desc by default", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			await seedOrderFor(tx, base, {
				folio: "OLD",
				createdAt: new Date("2024-01-01T00:00:00.000Z"),
				updatedAt: new Date("2024-01-01T00:00:00.000Z"),
			});
			await seedOrderFor(tx, base, {
				folio: "MID",
				createdAt: new Date("2024-02-01T00:00:00.000Z"),
				updatedAt: new Date("2024-02-01T00:00:00.000Z"),
			});
			await seedOrderFor(tx, base, {
				folio: "NEW",
				createdAt: new Date("2024-03-01T00:00:00.000Z"),
				updatedAt: new Date("2024-03-01T00:00:00.000Z"),
			});

			const result = await paginatedOrderHandler({
				query: {
					workspaceId: base.workspaceId,
					paginationRequest: {
						limit: 10,
						orderBy: "createdAt",
						direction: "desc",
					},
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((o) => o.folio)).toEqual([
				"NEW",
				"MID",
				"OLD",
			]);
			expect(result.value.items.map((o) => o.createdAt)).toEqual([
				"2024-03-01T00:00:00.000Z",
				"2024-02-01T00:00:00.000Z",
				"2024-01-01T00:00:00.000Z",
			]);
			expect(result.value.items.map((o) => o.updatedAt)).toEqual([
				"2024-03-01T00:00:00.000Z",
				"2024-02-01T00:00:00.000Z",
				"2024-01-01T00:00:00.000Z",
			]);
		});
	});

	test("Should sort by status asc", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			await seedOrderFor(tx, base, { folio: "P", status: "pendiente" });
			await seedOrderFor(tx, base, { folio: "C", status: "cancelada" });
			await seedOrderFor(tx, base, { folio: "D", status: "entregada" });

			const result = await paginatedOrderHandler({
				query: {
					workspaceId: base.workspaceId,
					paginationRequest: { limit: 10, orderBy: "status", direction: "asc" },
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((o) => o.status)).toEqual([
				"cancelada",
				"entregada",
				"pendiente",
			]);
		});
	});

	test("Should sort by id asc", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			const o1 = await seedOrderFor(tx, base, {
				id: "00000000000000000000000001",
			});
			const o2 = await seedOrderFor(tx, base, {
				id: "00000000000000000000000002",
			});
			const o3 = await seedOrderFor(tx, base, {
				id: "00000000000000000000000003",
			});

			const result = await paginatedOrderHandler({
				query: {
					workspaceId: base.workspaceId,
					paginationRequest: { limit: 10, orderBy: "id", direction: "asc" },
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((o) => o.id)).toEqual([o1, o2, o3]);
		});
	});

	// ── D. Search ────────────────────────────────────────────────────

	test("Should filter by search on folio", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			await seedOrderFor(tx, base, { folio: "TECFIX-001" });
			await seedOrderFor(tx, base, { folio: "TECFIX-002" });

			const result = await paginatedOrderHandler({
				query: {
					workspaceId: base.workspaceId,
					paginationRequest: {
						limit: 10,
						orderBy: "folio",
						direction: "asc",
						search: "TECFIX-001",
					},
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(first(result.value.items).folio).toBe("TECFIX-001");
		});
	});

	test("Should filter by search on client name", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			await seedOrderFor(tx, base, {
				folio: "A",
				clientNameSnapshot: "Juan Pérez",
			});
			await seedOrderFor(tx, base, {
				folio: "B",
				clientNameSnapshot: "María López",
			});

			const result = await paginatedOrderHandler({
				query: {
					workspaceId: base.workspaceId,
					paginationRequest: {
						limit: 10,
						orderBy: "folio",
						direction: "asc",
						search: "Juan",
					},
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(first(result.value.items).clientName).toBe("Juan Pérez");
		});
	});

	test("Should return empty when search has no matches", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);
			await seedOrderFor(tx, base, { folio: "TECFIX-001" });

			const result = await paginatedOrderHandler({
				query: {
					workspaceId: base.workspaceId,
					paginationRequest: {
						limit: 10,
						orderBy: "folio",
						direction: "asc",
						search: "NoExiste",
					},
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(0);
			expect(result.value.hasNextPage).toBe(false);
		});
	});

	// ── E. Status Filter ─────────────────────────────────────────────

	test("Should filter orders by status", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			await seedOrderFor(tx, base, { folio: "A", status: "pendiente" });
			await seedOrderFor(tx, base, { folio: "B", status: "entregada" });
			await seedOrderFor(tx, base, { folio: "C", status: "cancelada" });

			const result = await paginatedOrderHandler({
				query: {
					workspaceId: base.workspaceId,
					status: "entregada",
					paginationRequest: { limit: 10, orderBy: "folio", direction: "asc" },
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(first(result.value.items).folio).toBe("B");
			expect(first(result.value.items).status).toBe("entregada");
		});
	});

	// ── F. Read Model ───────────────────────────────────────────────

	test("Should expose the order summary fields", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);
			await seedOrderFor(tx, base, { folio: "TECFIX-001" });

			const result = await paginatedOrderHandler({
				query: {
					workspaceId: base.workspaceId,
					paginationRequest: { limit: 10, orderBy: "folio", direction: "asc" },
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			const summary = first(result.value.items);
			expect(summary.userPictureUrl).toBe("https://example.com/avatar.png");
			expect(summary.clientName).toBe("Test Client");
			expect(summary.deviceFullName).toBe("Samsung Galaxy S21");
			expect(summary.createdByName).toBe("Test User");
		});
	});

	// ── G. Cursor Pagination ────────────────────────────────────────

	test("Should set hasNextPage=true and a cursor when more items than limit", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			for (const folio of ["ORD-1", "ORD-2", "ORD-3"]) {
				await seedOrderFor(tx, base, { folio });
			}

			const result = await paginatedOrderHandler({
				query: {
					workspaceId: base.workspaceId,
					paginationRequest: { limit: 2, orderBy: "folio", direction: "asc" },
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(2);
			expect(result.value.hasNextPage).toBe(true);
			expect(result.value.cursor).not.toBeNull();
			expect(first(result.value.items).folio).toBe("ORD-1");
			expect(result.value.items[1]?.folio).toBe("ORD-2");
		});
	});

	test("Should return the second page via cursor", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			for (const folio of ["ORD-1", "ORD-2", "ORD-3"]) {
				await seedOrderFor(tx, base, { folio });
			}

			const page1 = await paginatedOrderHandler({
				query: {
					workspaceId: base.workspaceId,
					paginationRequest: { limit: 2, orderBy: "folio", direction: "asc" },
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(page1.isSuccess).toBe(true);
			expect(page1.value.hasNextPage).toBe(true);

			const page2 = await paginatedOrderHandler({
				query: {
					workspaceId: base.workspaceId,
					paginationRequest: {
						limit: 2,
						orderBy: "folio",
						direction: "asc",
						cursor: page1.value.cursor ?? undefined,
					},
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(page2.isSuccess).toBe(true);
			expect(page2.value.items).toHaveLength(1);
			expect(first(page2.value.items).folio).toBe("ORD-3");
			expect(page2.value.hasNextPage).toBe(false);
			expect(page2.value.cursor).toBeNull();
		});
	});

	test("Should paginate by createdAt without duplicates or skips", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			const orderIds: string[] = [];
			for (const [index, date] of [
				"2024-01-01T00:00:00.000Z",
				"2024-02-01T00:00:00.000Z",
				"2024-03-01T00:00:00.000Z",
			].entries()) {
				const id = await seedOrderFor(tx, base, {
					folio: `ORD-${index + 1}`,
					createdAt: new Date(date),
					updatedAt: new Date(date),
				});
				orderIds.push(id);
			}

			const page1 = await paginatedOrderHandler({
				query: {
					workspaceId: base.workspaceId,
					paginationRequest: {
						limit: 2,
						orderBy: "createdAt",
						direction: "asc",
					},
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(page1.isSuccess).toBe(true);
			expect(page1.value.items).toHaveLength(2);
			expect(page1.value.hasNextPage).toBe(true);

			const page2 = await paginatedOrderHandler({
				query: {
					workspaceId: base.workspaceId,
					paginationRequest: {
						limit: 2,
						orderBy: "createdAt",
						direction: "asc",
						cursor: page1.value.cursor ?? undefined,
					},
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(page2.isSuccess).toBe(true);
			expect(page2.value.items).toHaveLength(1);
			expect(page2.value.hasNextPage).toBe(false);

			const allFolios = [
				...page1.value.items.map((o) => o.folio),
				...page2.value.items.map((o) => o.folio),
			];
			expect(allFolios).toEqual(["ORD-1", "ORD-2", "ORD-3"]);

			const allCreatedAt = [
				...page1.value.items.map((o) => o.createdAt),
				...page2.value.items.map((o) => o.createdAt),
			];
			expect(allCreatedAt).toEqual([
				"2024-01-01T00:00:00.000Z",
				"2024-02-01T00:00:00.000Z",
				"2024-03-01T00:00:00.000Z",
			]);
		});
	});

	test("Should paginate without duplicates or skips on tie-breaking by id", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			for (const id of [
				"00000000000000000000000001",
				"00000000000000000000000002",
				"00000000000000000000000003",
			]) {
				await seedOrderFor(tx, base, {
					id,
					folio: `SAME-${id}`,
					clientNameSnapshot: "Same Client",
				});
			}

			const page1 = await paginatedOrderHandler({
				query: {
					workspaceId: base.workspaceId,
					paginationRequest: {
						limit: 2,
						orderBy: "clientName",
						direction: "asc",
					},
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(page1.isSuccess).toBe(true);
			expect(page1.value.items).toHaveLength(2);

			const page2 = await paginatedOrderHandler({
				query: {
					workspaceId: base.workspaceId,
					paginationRequest: {
						limit: 2,
						orderBy: "clientName",
						direction: "asc",
						cursor: page1.value.cursor ?? undefined,
					},
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(page2.isSuccess).toBe(true);
			expect(page2.value.items).toHaveLength(1);
			expect(page2.value.hasNextPage).toBe(false);

			const allIds = [
				...page1.value.items.map((o) => o.id),
				...page2.value.items.map((o) => o.id),
			].sort();
			expect(allIds).toEqual([
				"00000000000000000000000001",
				"00000000000000000000000002",
				"00000000000000000000000003",
			]);
		});
	});
});
