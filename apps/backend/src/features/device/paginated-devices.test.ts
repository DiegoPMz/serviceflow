import { afterEach, describe, expect, test } from "bun:test";
import {
	clients,
	type DatabaseClient,
	type DatabaseType,
	db,
	devices,
	workspaces,
} from "@serviceflow/backend/shared/database";
import { eq } from "drizzle-orm";
import { ulid } from "ulidx";
import type { DeviceReadModel } from "./common/device.read-model";
import { deviceDrizzleRepository } from "./common/device-drizzle-repository";
import { paginatedDeviceQueryHandler } from "./paginated-devices";

const seededWorkspaces: string[] = [];

const seedWorkspace = async (
	db: DatabaseType | DatabaseClient,
	prefix?: string,
) => {
	const workspaceId = ulid();
	await db.insert(workspaces).values({
		id: workspaceId,
		name: "Test Workspace",
		prefix: prefix ?? "TEST",
		orderCount: 0,
	});
	seededWorkspaces.push(workspaceId);
	return workspaceId;
};

const seedClient = async (
	db: DatabaseType | DatabaseClient,
	workspaceId: string,
	overrides?: {
		name?: string;
		phoneNumber?: string;
		email?: string;
		location?: string;
	},
) => {
	const clientId = ulid();
	await db.insert(clients).values({
		id: clientId,
		workspaceId,
		name: "Test Client",
		phoneNumber: "+5215551234567",
		email: `client-${clientId}@example.com`,
		location: "CDMX",
		...(overrides ?? {}),
	});
	return clientId;
};

const seedDevice = async (
	db: DatabaseType | DatabaseClient,
	opts: {
		workspaceId: string;
		clientId: string;
		serialNumber?: string;
		brand?: string;
		model?: string;
		id?: string;
	},
) => {
	const id = opts.id ?? ulid();
	const [row] = await db
		.insert(devices)
		.values({
			id,
			workspaceId: opts.workspaceId,
			clientId: opts.clientId,
			serialNumber: opts.serialNumber ?? `SN-${ulid()}`,
			brand: opts.brand ?? "Samsung",
			model: opts.model ?? "Galaxy S21",
		})
		.returning();
	if (!row) throw new Error("Failed to create test device");
	return row;
};

function first<T>(arr: T[]): T {
	expect(arr.length).toBeGreaterThan(0);
	return arr[0] as T;
}

afterEach(async () => {
	for (const workspaceId of seededWorkspaces) {
		await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
	}
	seededWorkspaces.length = 0;
});

describe("Paginated-Devices Integration Tests", () => {
	// ── A. Cursor Validation ─────────────────────────────────────────

	test("Should return PAGINATION_CURSOR_INVALID when cursor is corrupted", async () => {
		const workspaceId = await seedWorkspace(db);
		await seedClient(db, workspaceId);

		const result = await paginatedDeviceQueryHandler({
			query: {
				workspaceId,
				paginationRequest: {
					limit: 10,
					cursor: "not-a-valid-cursor!!!",
					orderBy: "brand",
					direction: "asc",
				},
			},
			repository: deviceDrizzleRepository(db),
		});

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("PAGINATION_CURSOR_INVALID");
	});

	test("Should return PAGINATION_CURSOR_INVALID when cursor orderBy mismatches request", async () => {
		const workspaceId = await seedWorkspace(db);
		const clientId = await seedClient(db, workspaceId);

		const device = await seedDevice(db, { workspaceId, clientId });

		const cursor = Buffer.from(
			JSON.stringify({
				orderBy: "model",
				direction: "asc",
				value: device.model,
				id: device.id,
			}),
		).toString("base64");

		const result = await paginatedDeviceQueryHandler({
			query: {
				workspaceId,
				paginationRequest: {
					limit: 10,
					cursor,
					orderBy: "brand",
					direction: "asc",
				},
			},
			repository: deviceDrizzleRepository(db),
		});

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("PAGINATION_CURSOR_INVALID");
	});

	// ── B. Empty / Isolation ────────────────────────────────────────

	test("Should return empty result when workspace has no devices", async () => {
		const workspaceId = await seedWorkspace(db);
		await seedClient(db, workspaceId);

		const result = await paginatedDeviceQueryHandler({
			query: {
				workspaceId,
				paginationRequest: { limit: 10, orderBy: "brand", direction: "asc" },
			},
			repository: deviceDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items).toHaveLength(0);
		expect(result.value.hasNextPage).toBe(false);
		expect(result.value.cursor).toBeNull();
	});

	test("Should not return devices from a different workspace", async () => {
		const ws1 = await seedWorkspace(db, "TEST1");
		const client1 = await seedClient(db, ws1);
		await seedDevice(db, { workspaceId: ws1, clientId: client1 });

		const ws2 = await seedWorkspace(db, "TEST2");
		const client2 = await seedClient(db, ws2);
		await seedDevice(db, { workspaceId: ws2, clientId: client2 });

		const result = await paginatedDeviceQueryHandler({
			query: {
				workspaceId: ws1,
				paginationRequest: { limit: 10, orderBy: "brand", direction: "asc" },
			},
			repository: deviceDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items).toHaveLength(1);
		expect(result.value.items[0]?.clientId).toBe(client1);
	});

	// ── C. Sorting ──────────────────────────────────────────────────

	const sortScenarios: {
		name: string;
		orderBy: "brand" | "model" | "serialNumber" | "id";
		values: { brand: string; model: string; serialNumber: string };
		expectedAsc: [string, string, string];
	}[] = [
		{
			name: "brand",
			orderBy: "brand",
			values: {
				brand: "Apple",
				model: "iPhone",
				serialNumber: "SN-A",
			},
			expectedAsc: ["Apple", "Samsung", "Xiaomi"],
		},
		{
			name: "model",
			orderBy: "model",
			values: {
				brand: "Samsung",
				model: "A10",
				serialNumber: "SN-A",
			},
			expectedAsc: ["A10", "Galaxy", "X20"],
		},
		{
			name: "serialNumber",
			orderBy: "serialNumber",
			values: {
				brand: "Samsung",
				model: "Galaxy",
				serialNumber: "SN-001",
			},
			expectedAsc: ["SN-001", "SN-002", "SN-003"],
		},
	];

	for (const scenario of sortScenarios) {
		test(`Should sort by ${scenario.name} asc`, async () => {
			const workspaceId = await seedWorkspace(db);
			const clientId = await seedClient(db, workspaceId);

			await seedDevice(db, {
				workspaceId,
				clientId,
				...scenario.values,
			});

			await seedDevice(db, {
				workspaceId,
				clientId,
				brand: "Samsung",
				model: "Galaxy",
				serialNumber: "SN-002",
			});

			await seedDevice(db, {
				workspaceId,
				clientId,
				brand: "Xiaomi",
				model: "X20",
				serialNumber: "SN-003",
			});

			const result = await paginatedDeviceQueryHandler({
				query: {
					workspaceId,
					paginationRequest: {
						limit: 10,
						orderBy: scenario.orderBy,
						direction: "asc",
					},
				},
				repository: deviceDrizzleRepository(db),
			});

			expect(result.isSuccess).toBe(true);

			const ordered = result.value.items.map(
				(device) => device[scenario.orderBy],
			);

			expect(ordered).toEqual(scenario.expectedAsc);
		});

		test(`Should sort by ${scenario.name} desc`, async () => {
			const workspaceId = await seedWorkspace(db);
			const clientId = await seedClient(db, workspaceId);

			await seedDevice(db, {
				workspaceId,
				clientId,
				...scenario.values,
			});

			await seedDevice(db, {
				workspaceId,
				clientId,
				brand: "Samsung",
				model: "Galaxy",
				serialNumber: "SN-002",
			});

			await seedDevice(db, {
				workspaceId,
				clientId,
				brand: "Xiaomi",
				model: "X20",
				serialNumber: "SN-003",
			});

			const result = await paginatedDeviceQueryHandler({
				query: {
					workspaceId,
					paginationRequest: {
						limit: 10,
						orderBy: scenario.orderBy,
						direction: "desc",
					},
				},
				repository: deviceDrizzleRepository(db),
			});

			expect(result.isSuccess).toBe(true);

			const ordered = result.value.items.map(
				(device) => device[scenario.orderBy],
			);

			expect(ordered).toEqual([...scenario.expectedAsc].reverse());
		});
	}

	test("Should sort by id asc", async () => {
		const workspaceId = await seedWorkspace(db);
		const clientId = await seedClient(db, workspaceId);

		const d1 = await seedDevice(db, {
			workspaceId,
			clientId,
			id: "00000000000000000000000001",
		});
		const d2 = await seedDevice(db, {
			workspaceId,
			clientId,
			id: "00000000000000000000000002",
		});
		const d3 = await seedDevice(db, {
			workspaceId,
			clientId,
			id: "00000000000000000000000003",
		});

		const result = await paginatedDeviceQueryHandler({
			query: {
				workspaceId,
				paginationRequest: { limit: 10, orderBy: "id", direction: "asc" },
			},
			repository: deviceDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items.map((d) => d.id)).toEqual([d1.id, d2.id, d3.id]);
	});

	test("should paginate only devices belonging to the specified client", async () => {
		const workspaceId = await seedWorkspace(db);

		const clientAId = await seedClient(db, workspaceId, {
			phoneNumber: "+5215551000001",
			email: "client-a@example.com",
		});

		const clientBId = await seedClient(db, workspaceId, {
			phoneNumber: "+5215551000002",
			email: "client-b@example.com",
		});

		const clientADevices = await Promise.all(
			Array.from({ length: 5 }, (_, index) =>
				seedDevice(db, {
					workspaceId,
					clientId: clientAId,
					id: ulid(),
					serialNumber: `A-${index}`,
				}),
			),
		);

		await Promise.all(
			Array.from({ length: 5 }, (_, index) =>
				seedDevice(db, {
					workspaceId,
					clientId: clientBId,
					id: ulid(),
					serialNumber: `B-${index}`,
				}),
			),
		);

		const pageSize = 2;

		let cursor: string | undefined;
		const result: DeviceReadModel[] = [];

		let hasNextPage = true;

		while (hasNextPage) {
			const response = await paginatedDeviceQueryHandler({
				query: {
					paginationRequest: {
						limit: pageSize,
						cursor,
						orderBy: "id",
						direction: "asc",
					},
					workspaceId,
					clientId: clientAId,
				},
				repository: deviceDrizzleRepository(db),
			});

			expect(response.isSuccess).toBe(true);

			const page = response.value;

			expect(page.items.every((device) => device.clientId === clientAId)).toBe(
				true,
			);

			result.push(...page.items);

			cursor = page.cursor ?? undefined;
			hasNextPage = page.hasNextPage;
		}

		expect(result).toHaveLength(clientADevices.length);

		expect(result.every((device) => device.clientId === clientAId)).toBe(true);

		expect(new Set(result.map((device) => device.id))).toHaveLength(
			clientADevices.length,
		);
	});

	// ── D. Search ────────────────────────────────────────────────────

	test("Should filter by search across brand, model and serialNumber", async () => {
		const workspaceId = await seedWorkspace(db);
		const clientId = await seedClient(db, workspaceId);

		await seedDevice(db, {
			workspaceId,
			clientId,
			brand: "Samsung",
			model: "Galaxy",
			serialNumber: "SN-ABC",
		});
		await seedDevice(db, {
			workspaceId,
			clientId,
			brand: "Apple",
			model: "iPhone",
			serialNumber: "SN-XYZ",
		});

		const result = await paginatedDeviceQueryHandler({
			query: {
				workspaceId,
				paginationRequest: {
					limit: 10,
					orderBy: "brand",
					direction: "asc",
					search: "Galaxy",
				},
			},
			repository: deviceDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items).toHaveLength(1);
		expect(first(result.value.items).model).toBe("Galaxy");
	});

	test("Should return empty when search has no matches", async () => {
		const workspaceId = await seedWorkspace(db);
		const clientId = await seedClient(db, workspaceId);

		await seedDevice(db, {
			workspaceId,
			clientId,
			brand: "Samsung",
			model: "Galaxy",
			serialNumber: "SN-ABC",
		});

		const result = await paginatedDeviceQueryHandler({
			query: {
				workspaceId,
				paginationRequest: {
					limit: 10,
					orderBy: "brand",
					direction: "asc",
					search: "NoExiste",
				},
			},
			repository: deviceDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items).toHaveLength(0);
		expect(result.value.hasNextPage).toBe(false);
	});

	// ── E. Cursor Pagination ────────────────────────────────────────

	test("Should set hasNextPage=true and a cursor when more items than limit", async () => {
		const workspaceId = await seedWorkspace(db);
		const clientId = await seedClient(db, workspaceId);

		await seedDevice(db, { workspaceId, clientId, brand: "A" });
		await seedDevice(db, { workspaceId, clientId, brand: "B" });
		await seedDevice(db, { workspaceId, clientId, brand: "C" });

		const result = await paginatedDeviceQueryHandler({
			query: {
				workspaceId,
				paginationRequest: { limit: 2, orderBy: "brand", direction: "asc" },
			},
			repository: deviceDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items).toHaveLength(2);
		expect(result.value.hasNextPage).toBe(true);
		expect(result.value.cursor).not.toBeNull();
		expect(first(result.value.items).brand).toBe("A");
		expect(result.value.items[1]?.brand).toBe("B");
	});

	test("Should return the second page via cursor", async () => {
		const workspaceId = await seedWorkspace(db);
		const clientId = await seedClient(db, workspaceId);

		await seedDevice(db, { workspaceId, clientId, brand: "A" });
		await seedDevice(db, { workspaceId, clientId, brand: "B" });
		await seedDevice(db, { workspaceId, clientId, brand: "C" });

		const page1 = await paginatedDeviceQueryHandler({
			query: {
				workspaceId,
				paginationRequest: { limit: 2, orderBy: "brand", direction: "asc" },
			},
			repository: deviceDrizzleRepository(db),
		});

		expect(page1.isSuccess).toBe(true);
		expect(page1.value.hasNextPage).toBe(true);

		const page2 = await paginatedDeviceQueryHandler({
			query: {
				workspaceId,
				paginationRequest: {
					limit: 2,
					orderBy: "brand",
					direction: "asc",
					cursor: page1.value.cursor ?? undefined,
				},
			},
			repository: deviceDrizzleRepository(db),
		});

		expect(page2.isSuccess).toBe(true);
		expect(page2.value.items).toHaveLength(1);
		expect(first(page2.value.items).brand).toBe("C");
		expect(page2.value.hasNextPage).toBe(false);
		expect(page2.value.cursor).toBeNull();
	});

	test("Should set hasNextPage=false when items are within limit", async () => {
		const workspaceId = await seedWorkspace(db);
		const clientId = await seedClient(db, workspaceId);

		await seedDevice(db, { workspaceId, clientId, brand: "A" });
		await seedDevice(db, { workspaceId, clientId, brand: "B" });

		const result = await paginatedDeviceQueryHandler({
			query: {
				workspaceId,
				paginationRequest: { limit: 5, orderBy: "brand", direction: "asc" },
			},
			repository: deviceDrizzleRepository(db),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.items).toHaveLength(2);
		expect(result.value.hasNextPage).toBe(false);
		expect(result.value.cursor).toBeNull();
	});

	test("Should paginate without duplicates or skips on tie-breaking by id", async () => {
		const workspaceId = await seedWorkspace(db);
		const clientId = await seedClient(db, workspaceId);

		const d1 = await seedDevice(db, {
			workspaceId,
			clientId,
			brand: "Same",
			id: "00000000000000000000000001",
		});
		const d2 = await seedDevice(db, {
			workspaceId,
			clientId,
			brand: "Same",
			id: "00000000000000000000000002",
		});
		const d3 = await seedDevice(db, {
			workspaceId,
			clientId,
			brand: "Same",
			id: "00000000000000000000000003",
		});

		const page1 = await paginatedDeviceQueryHandler({
			query: {
				workspaceId,
				paginationRequest: { limit: 2, orderBy: "brand", direction: "asc" },
			},
			repository: deviceDrizzleRepository(db),
		});

		expect(page1.isSuccess).toBe(true);
		expect(page1.value.items).toHaveLength(2);

		const page2 = await paginatedDeviceQueryHandler({
			query: {
				workspaceId,
				paginationRequest: {
					limit: 2,
					orderBy: "brand",
					direction: "asc",
					cursor: page1.value.cursor ?? undefined,
				},
			},
			repository: deviceDrizzleRepository(db),
		});

		expect(page2.isSuccess).toBe(true);
		expect(page2.value.items).toHaveLength(1);
		expect(page2.value.hasNextPage).toBe(false);

		const allIds = [
			...page1.value.items.map((i) => i.id),
			...page2.value.items.map((i) => i.id),
		].sort();
		const expectedIds = [d1.id, d2.id, d3.id].sort();
		expect(allIds).toEqual(expectedIds);
	});
});
