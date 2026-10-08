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
	// ── A. Empty / Isolation ────────────────────────────────────────

	test("Should return empty result when workspace has no orders", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			const result = await paginatedOrderHandler({
				query: {
					paginationRequest: {
						page: 1,
						pageSize: 10,
					},
					workspaceId: base.workspaceId,
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(0);
			expect(result.value.page).toBe(1);
			expect(result.value.pageSize).toBe(10);
			expect(result.value.totalItems).toBe(0);
			expect(result.value.totalPages).toBe(0);
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
					paginationRequest: {
						page: 1,
						pageSize: 10,
					},
					workspaceId: base.workspaceId,
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(first(result.value.items).folio).toBe("WS1-1");
			expect(result.value.totalItems).toBe(1);
			expect(result.value.totalPages).toBe(1);
		});
	});

	// ── B. Sorting ──────────────────────────────────────────────────

	test("Should sort by updatedAt desc by default", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			await seedOrderFor(tx, base, {
				folio: "OLD",
				updatedAt: new Date("2024-01-01T00:00:00.000Z"),
			});

			await seedOrderFor(tx, base, {
				folio: "MID",
				updatedAt: new Date("2024-02-01T00:00:00.000Z"),
			});

			await seedOrderFor(tx, base, {
				folio: "NEW",
				updatedAt: new Date("2024-03-01T00:00:00.000Z"),
			});

			const result = await paginatedOrderHandler({
				query: {
					paginationRequest: {
						page: 1,
						pageSize: 10,
					},
					workspaceId: base.workspaceId,
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);

			expect(result.value.items.map((o) => o.folio)).toEqual([
				"NEW",
				"MID",
				"OLD",
			]);
		});
	});

	test("Should sort by updatedAt asc when direction is asc", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			await seedOrderFor(tx, base, {
				folio: "OLD",
				updatedAt: new Date("2024-01-01T00:00:00.000Z"),
			});

			await seedOrderFor(tx, base, {
				folio: "MID",
				updatedAt: new Date("2024-02-01T00:00:00.000Z"),
			});

			await seedOrderFor(tx, base, {
				folio: "NEW",
				updatedAt: new Date("2024-03-01T00:00:00.000Z"),
			});

			const result = await paginatedOrderHandler({
				query: {
					paginationRequest: {
						page: 1,
						pageSize: 10,
						direction: "asc",
					},
					workspaceId: base.workspaceId,
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);

			expect(result.value.items.map((o) => o.folio)).toEqual([
				"OLD",
				"MID",
				"NEW",
			]);
		});
	});

	test("Should use id as tie-breaker when updatedAt is equal", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			const updatedAt = new Date("2024-01-01T00:00:00.000Z");

			for (const id of [
				"00000000000000000000000001",
				"00000000000000000000000002",
				"00000000000000000000000003",
			]) {
				await seedOrderFor(tx, base, {
					id,
					folio: `ORD-${id}`,
					updatedAt,
				});
			}

			const result = await paginatedOrderHandler({
				query: {
					paginationRequest: {
						page: 1,
						pageSize: 10,
					},
					workspaceId: base.workspaceId,
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);

			expect(result.value.items.map((o) => o.id)).toEqual([
				"00000000000000000000000003",
				"00000000000000000000000002",
				"00000000000000000000000001",
			]);
		});
	});

	// ── C. Search ───────────────────────────────────────────────────

	test("Should filter by search on folio", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			await seedOrderFor(tx, base, {
				folio: "TECFIX-001",
			});

			await seedOrderFor(tx, base, {
				folio: "TECFIX-002",
			});

			const result = await paginatedOrderHandler({
				query: {
					paginationRequest: {
						page: 1,
						pageSize: 10,
						search: "TECFIX-001",
					},
					workspaceId: base.workspaceId,
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(first(result.value.items).folio).toBe("TECFIX-001");
			expect(result.value.totalItems).toBe(1);
			expect(result.value.totalPages).toBe(1);
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
					paginationRequest: {
						page: 1,
						pageSize: 10,
						search: "Juan",
					},
					workspaceId: base.workspaceId,
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(first(result.value.items).clientName).toBe("Juan Pérez");
			expect(result.value.totalItems).toBe(1);
			expect(result.value.totalPages).toBe(1);
		});
	});

	test("Should return empty when search has no matches", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			await seedOrderFor(tx, base, {
				folio: "TECFIX-001",
			});

			const result = await paginatedOrderHandler({
				query: {
					paginationRequest: {
						page: 1,
						pageSize: 10,
						search: "NoExiste",
					},
					workspaceId: base.workspaceId,
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(0);
			expect(result.value.totalItems).toBe(0);
			expect(result.value.totalPages).toBe(0);
		});
	});

	// ── D. Status Filter ────────────────────────────────────────────

	test("Should filter orders by status", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			await seedOrderFor(tx, base, {
				folio: "A",
				status: "pendiente",
			});

			await seedOrderFor(tx, base, {
				folio: "B",
				status: "entregada",
			});

			await seedOrderFor(tx, base, {
				folio: "C",
				status: "cancelada",
			});

			const result = await paginatedOrderHandler({
				query: {
					paginationRequest: {
						page: 1,
						pageSize: 10,
						status: "entregada",
					},
					workspaceId: base.workspaceId,
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(first(result.value.items).folio).toBe("B");
			expect(first(result.value.items).status).toBe("entregada");
			expect(result.value.totalItems).toBe(1);
			expect(result.value.totalPages).toBe(1);
		});
	});

	test("Should combine search and status filters", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			await seedOrderFor(tx, base, {
				folio: "TECFIX-001",
				status: "entregada",
			});

			await seedOrderFor(tx, base, {
				folio: "TECFIX-002",
				status: "pendiente",
			});

			await seedOrderFor(tx, base, {
				folio: "OTHER-001",
				status: "entregada",
			});

			const result = await paginatedOrderHandler({
				query: {
					paginationRequest: {
						page: 1,
						pageSize: 10,
						search: "TECFIX",
						status: "entregada",
					},
					workspaceId: base.workspaceId,
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(first(result.value.items).folio).toBe("TECFIX-001");
			expect(first(result.value.items).status).toBe("entregada");
			expect(result.value.totalItems).toBe(1);
			expect(result.value.totalPages).toBe(1);
		});
	});

	// ── E. Read Model ───────────────────────────────────────────────

	test("Should expose the order summary fields", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			await seedOrderFor(tx, base, {
				folio: "TECFIX-001",
			});

			const result = await paginatedOrderHandler({
				query: {
					paginationRequest: {
						page: 1,
						pageSize: 10,
					},
					workspaceId: base.workspaceId,
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

	// ── F. Offset Pagination ────────────────────────────────────────

	test("Should return the first page", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			for (const folio of ["ORD-1", "ORD-2", "ORD-3"]) {
				await seedOrderFor(tx, base, { folio });
			}

			const result = await paginatedOrderHandler({
				query: {
					paginationRequest: {
						page: 1,
						pageSize: 2,
					},
					workspaceId: base.workspaceId,
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(2);
			expect(result.value.page).toBe(1);
			expect(result.value.pageSize).toBe(2);
			expect(result.value.totalItems).toBe(3);
			expect(result.value.totalPages).toBe(2);
		});
	});

	test("Should return the second page", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			await seedOrderFor(tx, base, {
				folio: "ORD-1",
				updatedAt: new Date("2024-01-01T00:00:00.000Z"),
			});

			await seedOrderFor(tx, base, {
				folio: "ORD-2",
				updatedAt: new Date("2024-02-01T00:00:00.000Z"),
			});

			await seedOrderFor(tx, base, {
				folio: "ORD-3",
				updatedAt: new Date("2024-03-01T00:00:00.000Z"),
			});

			const result = await paginatedOrderHandler({
				query: {
					paginationRequest: {
						page: 2,
						pageSize: 2,
					},
					workspaceId: base.workspaceId,
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(first(result.value.items).folio).toBe("ORD-1");
			expect(result.value.page).toBe(2);
			expect(result.value.pageSize).toBe(2);
			expect(result.value.totalItems).toBe(3);
			expect(result.value.totalPages).toBe(2);
		});
	});

	test("Should return empty result when page is beyond the last page", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			for (const folio of ["ORD-1", "ORD-2", "ORD-3"]) {
				await seedOrderFor(tx, base, { folio });
			}

			const result = await paginatedOrderHandler({
				query: {
					paginationRequest: {
						page: 3,
						pageSize: 2,
					},
					workspaceId: base.workspaceId,
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(0);
			expect(result.value.page).toBe(3);
			expect(result.value.pageSize).toBe(2);
			expect(result.value.totalItems).toBe(3);
			expect(result.value.totalPages).toBe(2);
		});
	});

	test("Should paginate without duplicates or skips", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);

			for (const [index, date] of [
				"2024-01-01T00:00:00.000Z",
				"2024-02-01T00:00:00.000Z",
				"2024-03-01T00:00:00.000Z",
				"2024-04-01T00:00:00.000Z",
				"2024-05-01T00:00:00.000Z",
			].entries()) {
				await seedOrderFor(tx, base, {
					folio: `ORD-${index + 1}`,
					updatedAt: new Date(date),
				});
			}

			const page1 = await paginatedOrderHandler({
				query: {
					paginationRequest: {
						page: 1,
						pageSize: 2,
					},
					workspaceId: base.workspaceId,
				},
				repository: OrderDrizzleRepository(tx),
			});

			const page2 = await paginatedOrderHandler({
				query: {
					paginationRequest: {
						page: 2,
						pageSize: 2,
					},
					workspaceId: base.workspaceId,
				},
				repository: OrderDrizzleRepository(tx),
			});

			const page3 = await paginatedOrderHandler({
				query: {
					paginationRequest: {
						page: 3,
						pageSize: 2,
					},
					workspaceId: base.workspaceId,
				},
				repository: OrderDrizzleRepository(tx),
			});

			expect(page1.isSuccess).toBe(true);
			expect(page2.isSuccess).toBe(true);
			expect(page3.isSuccess).toBe(true);

			const allFolios = [
				...page1.value.items.map((o) => o.folio),
				...page2.value.items.map((o) => o.folio),
				...page3.value.items.map((o) => o.folio),
			];

			expect(allFolios).toEqual(["ORD-5", "ORD-4", "ORD-3", "ORD-2", "ORD-1"]);

			expect(page1.value.totalItems).toBe(5);
			expect(page1.value.totalPages).toBe(3);

			expect(page2.value.totalItems).toBe(5);
			expect(page2.value.totalPages).toBe(3);

			expect(page3.value.totalItems).toBe(5);
			expect(page3.value.totalPages).toBe(3);
		});
	});
});
