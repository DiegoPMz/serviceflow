import { describe, expect, test } from "bun:test";
import type { DatabaseClient } from "@serviceflow/backend/shared/database";
import { deviceComponents } from "@serviceflow/backend/shared/database";
import { seedClient } from "@serviceflow/backend/shared/database/seeds/client.seeds";
import { seedDevice } from "@serviceflow/backend/shared/database/seeds/device.seeds";
import { seedWorkspace } from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import { PaginationErrors } from "@serviceflow/backend/shared/pagination";
import { first, runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { ulid } from "ulidx";
import type { ComponentType } from "./common/device.model";
import { deviceDrizzleRepository } from "./common/device-drizzle-repository";
import { paginatedDeviceComponentsHandler } from "./get-paginated-device-components";

const seedDeviceComponent = async (
	tx: DatabaseClient,
	deviceId: string,
	data: {
		name: string;
		partNumber: string;
		type?: ComponentType;
		id?: string;
		createdAt?: Date;
	},
) => {
	const [row] = await tx
		.insert(deviceComponents)
		.values({
			id: data.id ?? ulid(),
			deviceId,
			name: data.name,
			partNumber: data.partNumber,
			type: data.type ?? "supply",
			createdAt: data.createdAt,
			updatedAt: data.createdAt,
		})
		.returning();

	if (!row) throw new Error("Failed to create test device component");
	return row;
};

describe("Paginated-Device-Components Integration Tests", () => {
	// ── A. Device Existence ─────────────────────────────────────────

	test("Should return DEVICE_NOT_FOUND when the device does not exist in the workspace", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			const result = await paginatedDeviceComponentsHandler({
				query: {
					workspaceId,
					deviceId: "01H8X5Y9Z0123456789ABCDEFX",
					paginationRequest: {
						limit: 10,
						orderBy: "name",
						direction: "asc",
					},
				},
				repository: deviceDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("DEVICE_NOT_FOUND");
		});
	});

	test("Should return DEVICE_NOT_FOUND when the device belongs to another workspace", async () => {
		await runTestInTransaction(async (tx) => {
			const ws1 = await seedWorkspace(tx);
			const client1 = (await seedClient(tx, { workspaceId: ws1 })).id;
			const device1 = await seedDevice(tx, {
				workspaceId: ws1,
				clientId: client1,
			});

			const ws2 = await seedWorkspace(tx);

			const result = await paginatedDeviceComponentsHandler({
				query: {
					workspaceId: ws2,
					deviceId: device1.id,
					paginationRequest: {
						limit: 10,
						orderBy: "name",
						direction: "asc",
					},
				},
				repository: deviceDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("DEVICE_NOT_FOUND");
		});
	});

	// ── B. Cursor Validation ────────────────────────────────────────

	test("Should return PAGINATION_CURSOR_INVALID when cursor is corrupted", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const device = await seedDevice(tx, { workspaceId, clientId });

			const result = await paginatedDeviceComponentsHandler({
				query: {
					workspaceId,
					deviceId: device.id,
					paginationRequest: {
						limit: 10,
						cursor: "not-a-valid-cursor!!!",
						orderBy: "name",
						direction: "asc",
					},
				},
				repository: deviceDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(
				PaginationErrors.PAGINATION_CURSOR_INVALID.code,
			);
		});
	});

	test("Should return PAGINATION_CURSOR_INVALID when cursor orderBy mismatches request", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const device = await seedDevice(tx, { workspaceId, clientId });
			await seedDeviceComponent(tx, device.id, {
				name: "Batería",
				partNumber: "BAT-001",
			});

			const cursor = Buffer.from(
				JSON.stringify({
					orderBy: "partNumber",
					direction: "asc",
					value: "BAT-001",
					id: "01H8X5Y9Z0123456789ABCDEF1",
				}),
			).toString("base64");

			const result = await paginatedDeviceComponentsHandler({
				query: {
					workspaceId,
					deviceId: device.id,
					paginationRequest: {
						limit: 10,
						cursor,
						orderBy: "name",
						direction: "asc",
					},
				},
				repository: deviceDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(
				PaginationErrors.PAGINATION_CURSOR_INVALID.code,
			);
		});
	});

	// ── C. Empty / Isolation ───────────────────────────────────────

	test("Should return empty result when the device has no components", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const device = await seedDevice(tx, { workspaceId, clientId });

			const result = await paginatedDeviceComponentsHandler({
				query: {
					workspaceId,
					deviceId: device.id,
					paginationRequest: {
						limit: 10,
						orderBy: "name",
						direction: "asc",
					},
				},
				repository: deviceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(0);
			expect(result.value.hasNextPage).toBe(false);
			expect(result.value.cursor).toBeNull();
		});
	});

	test("Should not return components from devices in another workspace", async () => {
		await runTestInTransaction(async (tx) => {
			const ws1 = await seedWorkspace(tx);
			const client1 = (await seedClient(tx, { workspaceId: ws1 })).id;
			const device1 = await seedDevice(tx, {
				workspaceId: ws1,
				clientId: client1,
			});
			await seedDeviceComponent(tx, device1.id, {
				name: "Batería",
				partNumber: "BAT-001",
			});

			const ws2 = await seedWorkspace(tx, { prefix: "TEST2" });
			const client2 = (await seedClient(tx, { workspaceId: ws2 })).id;
			const device2 = await seedDevice(tx, {
				workspaceId: ws2,
				clientId: client2,
			});
			await seedDeviceComponent(tx, device2.id, {
				name: "Pantalla",
				partNumber: "SCR-001",
			});

			const result = await paginatedDeviceComponentsHandler({
				query: {
					workspaceId: ws1,
					deviceId: device1.id,
					paginationRequest: {
						limit: 10,
						orderBy: "name",
						direction: "asc",
					},
				},
				repository: deviceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(result.value.items[0]?.partNumber).toBe("BAT-001");
		});
	});

	test("Should only return components of the requested device within the same workspace", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const deviceA = await seedDevice(tx, { workspaceId, clientId });
			const deviceB = await seedDevice(tx, { workspaceId, clientId });

			await seedDeviceComponent(tx, deviceA.id, {
				name: "Batería",
				partNumber: "BAT-001",
			});
			await seedDeviceComponent(tx, deviceB.id, {
				name: "Pantalla",
				partNumber: "SCR-001",
			});

			const result = await paginatedDeviceComponentsHandler({
				query: {
					workspaceId,
					deviceId: deviceA.id,
					paginationRequest: {
						limit: 10,
						orderBy: "name",
						direction: "asc",
					},
				},
				repository: deviceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(result.value.items[0]?.partNumber).toBe("BAT-001");
		});
	});

	// ── D. Sorting ─────────────────────────────────────────────────

	test("Should sort by name asc", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const device = await seedDevice(tx, { workspaceId, clientId });

			await seedDeviceComponent(tx, device.id, {
				name: "Pantalla",
				partNumber: "SCR-001",
			});
			await seedDeviceComponent(tx, device.id, {
				name: "Batería",
				partNumber: "BAT-001",
			});
			await seedDeviceComponent(tx, device.id, {
				name: "Cargador",
				partNumber: "CHG-001",
			});

			const result = await paginatedDeviceComponentsHandler({
				query: {
					workspaceId,
					deviceId: device.id,
					paginationRequest: {
						limit: 10,
						orderBy: "name",
						direction: "asc",
					},
				},
				repository: deviceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((c) => c.name)).toEqual([
				"Batería",
				"Cargador",
				"Pantalla",
			]);
		});
	});

	test("Should sort by name desc", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const device = await seedDevice(tx, { workspaceId, clientId });

			await seedDeviceComponent(tx, device.id, {
				name: "Pantalla",
				partNumber: "SCR-001",
			});
			await seedDeviceComponent(tx, device.id, {
				name: "Batería",
				partNumber: "BAT-001",
			});
			await seedDeviceComponent(tx, device.id, {
				name: "Cargador",
				partNumber: "CHG-001",
			});

			const result = await paginatedDeviceComponentsHandler({
				query: {
					workspaceId,
					deviceId: device.id,
					paginationRequest: {
						limit: 10,
						orderBy: "name",
						direction: "desc",
					},
				},
				repository: deviceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((c) => c.name)).toEqual([
				"Pantalla",
				"Cargador",
				"Batería",
			]);
		});
	});

	test("Should sort by partNumber asc", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const device = await seedDevice(tx, { workspaceId, clientId });

			await seedDeviceComponent(tx, device.id, {
				name: "B",
				partNumber: "PN-002",
			});
			await seedDeviceComponent(tx, device.id, {
				name: "A",
				partNumber: "PN-001",
			});
			await seedDeviceComponent(tx, device.id, {
				name: "C",
				partNumber: "PN-003",
			});

			const result = await paginatedDeviceComponentsHandler({
				query: {
					workspaceId,
					deviceId: device.id,
					paginationRequest: {
						limit: 10,
						orderBy: "partNumber",
						direction: "asc",
					},
				},
				repository: deviceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((c) => c.partNumber)).toEqual([
				"PN-001",
				"PN-002",
				"PN-003",
			]);
		});
	});

	test("Should sort by id asc", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const device = await seedDevice(tx, { workspaceId, clientId });

			const c1 = await seedDeviceComponent(tx, device.id, {
				name: "A",
				partNumber: "PN-1",
				id: "00000000000000000000000001",
			});
			const c2 = await seedDeviceComponent(tx, device.id, {
				name: "B",
				partNumber: "PN-2",
				id: "00000000000000000000000002",
			});
			const c3 = await seedDeviceComponent(tx, device.id, {
				name: "C",
				partNumber: "PN-3",
				id: "00000000000000000000000003",
			});

			const result = await paginatedDeviceComponentsHandler({
				query: {
					workspaceId,
					deviceId: device.id,
					paginationRequest: {
						limit: 10,
						orderBy: "id",
						direction: "asc",
					},
				},
				repository: deviceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((c) => c.id)).toEqual([
				c1.id,
				c2.id,
				c3.id,
			]);
		});
	});

	// ── E. Search ──────────────────────────────────────────────────

	test("Should filter by search across name and partNumber", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const device = await seedDevice(tx, { workspaceId, clientId });

			await seedDeviceComponent(tx, device.id, {
				name: "Batería",
				partNumber: "BAT-001",
			});
			await seedDeviceComponent(tx, device.id, {
				name: "Pantalla",
				partNumber: "SCR-001",
			});

			const result = await paginatedDeviceComponentsHandler({
				query: {
					workspaceId,
					deviceId: device.id,
					paginationRequest: {
						limit: 10,
						orderBy: "name",
						direction: "asc",
						search: "BAT",
					},
				},
				repository: deviceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(first(result.value.items).name).toBe("Batería");
		});
	});

	test("Should return empty when search has no matches", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const device = await seedDevice(tx, { workspaceId, clientId });

			await seedDeviceComponent(tx, device.id, {
				name: "Batería",
				partNumber: "BAT-001",
			});

			const result = await paginatedDeviceComponentsHandler({
				query: {
					workspaceId,
					deviceId: device.id,
					paginationRequest: {
						limit: 10,
						orderBy: "name",
						direction: "asc",
						search: "NoExiste",
					},
				},
				repository: deviceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(0);
			expect(result.value.hasNextPage).toBe(false);
		});
	});

	// ── F. Cursor Pagination ───────────────────────────────────────

	test("Should set hasNextPage=true and a cursor when more items than limit", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const device = await seedDevice(tx, { workspaceId, clientId });

			await seedDeviceComponent(tx, device.id, {
				name: "A",
				partNumber: "PN-1",
			});
			await seedDeviceComponent(tx, device.id, {
				name: "B",
				partNumber: "PN-2",
			});
			await seedDeviceComponent(tx, device.id, {
				name: "C",
				partNumber: "PN-3",
			});

			const result = await paginatedDeviceComponentsHandler({
				query: {
					workspaceId,
					deviceId: device.id,
					paginationRequest: {
						limit: 2,
						orderBy: "name",
						direction: "asc",
					},
				},
				repository: deviceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(2);
			expect(result.value.hasNextPage).toBe(true);
			expect(result.value.cursor).not.toBeNull();
			expect(first(result.value.items).name).toBe("A");
			expect(result.value.items[1]?.name).toBe("B");
		});
	});

	test("Should return the second page via cursor", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const device = await seedDevice(tx, { workspaceId, clientId });

			await seedDeviceComponent(tx, device.id, {
				name: "A",
				partNumber: "PN-1",
			});

			await seedDeviceComponent(tx, device.id, {
				name: "B",
				partNumber: "PN-2",
			});

			await seedDeviceComponent(tx, device.id, {
				name: "C",
				partNumber: "PN-3",
			});

			const page1 = await paginatedDeviceComponentsHandler({
				query: {
					workspaceId,
					deviceId: device.id,
					paginationRequest: {
						limit: 2,
						orderBy: "name",
						direction: "asc",
					},
				},
				repository: deviceDrizzleRepository(tx),
			});

			expect(page1.isSuccess).toBe(true);
			expect(page1.value.hasNextPage).toBe(true);

			const page2 = await paginatedDeviceComponentsHandler({
				query: {
					workspaceId,
					deviceId: device.id,
					paginationRequest: {
						limit: 2,
						orderBy: "name",
						direction: "asc",
						cursor: page1.value.cursor ?? undefined,
					},
				},
				repository: deviceDrizzleRepository(tx),
			});

			expect(page2.isSuccess).toBe(true);
			expect(page2.value.items).toHaveLength(1);
			expect(first(page2.value.items).name).toBe("C");
			expect(page2.value.hasNextPage).toBe(false);
			expect(page2.value.cursor).toBeNull();
		});
	});

	test("Should paginate without duplicates or skips on tie-breaking by id", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const device = await seedDevice(tx, { workspaceId, clientId });

			const c1 = await seedDeviceComponent(tx, device.id, {
				name: "Same",
				partNumber: "PN-1",
				id: "00000000000000000000000001",
			});
			const c2 = await seedDeviceComponent(tx, device.id, {
				name: "Same",
				partNumber: "PN-2",
				id: "00000000000000000000000002",
			});
			const c3 = await seedDeviceComponent(tx, device.id, {
				name: "Same",
				partNumber: "PN-3",
				id: "00000000000000000000000003",
			});

			const page1 = await paginatedDeviceComponentsHandler({
				query: {
					workspaceId,
					deviceId: device.id,
					paginationRequest: {
						limit: 2,
						orderBy: "name",
						direction: "asc",
					},
				},
				repository: deviceDrizzleRepository(tx),
			});

			expect(page1.isSuccess).toBe(true);
			expect(page1.value.items).toHaveLength(2);

			const page2 = await paginatedDeviceComponentsHandler({
				query: {
					workspaceId,
					deviceId: device.id,
					paginationRequest: {
						limit: 2,
						orderBy: "name",
						direction: "asc",
						cursor: page1.value.cursor ?? undefined,
					},
				},
				repository: deviceDrizzleRepository(tx),
			});

			expect(page2.isSuccess).toBe(true);
			expect(page2.value.items).toHaveLength(1);
			expect(page2.value.hasNextPage).toBe(false);

			const allIds = [
				...page1.value.items.map((c) => c.id),
				...page2.value.items.map((c) => c.id),
			].sort();
			const expectedIds = [c1.id, c2.id, c3.id].sort();
			expect(allIds).toEqual(expectedIds);
		});
	});
});
