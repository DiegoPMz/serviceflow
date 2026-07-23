import { describe, expect, test } from "bun:test";
import { seedClient } from "@serviceflow/backend/shared/database/seeds/client.seeds";
import { seedDevice } from "@serviceflow/backend/shared/database/seeds/device.seeds";
import { seedWorkspace } from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import { PaginationErrors } from "@serviceflow/backend/shared/pagination";
import { first, runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { ulid } from "ulidx";
import type { DeviceReadModel } from "./common/device.read-model";
import { deviceDrizzleRepository } from "./common/device-drizzle-repository";
import { paginatedDeviceQueryHandler } from "./paginated-devices";

describe("Paginated-Devices Integration Tests", () => {
	// ── A. Cursor Validation ─────────────────────────────────────────

	test("Should return PAGINATION_CURSOR_INVALID when cursor is corrupted", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			await seedClient(tx, { workspaceId });

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
				repository: deviceDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(
				PaginationErrors.PAGINATION_CURSOR_INVALID.code,
			);
		});
	});

	// ── B. Empty / Isolation ────────────────────────────────────────

	test("Should return empty result when workspace has no devices", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			await seedClient(tx, { workspaceId });

			const result = await paginatedDeviceQueryHandler({
				query: {
					workspaceId,
					paginationRequest: { limit: 10, orderBy: "brand", direction: "asc" },
				},
				repository: deviceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(0);
			expect(result.value.hasNextPage).toBe(false);
			expect(result.value.cursor).toBeNull();
		});
	});

	test("Should not return devices from a different workspace", async () => {
		await runTestInTransaction(async (tx) => {
			const ws1 = await seedWorkspace(tx, { prefix: "TEST1" });
			const client1 = (await seedClient(tx, { workspaceId: ws1 })).id;
			await seedDevice(tx, { workspaceId: ws1, clientId: client1 });

			const ws2 = await seedWorkspace(tx, { prefix: "TEST2" });
			const client2 = (await seedClient(tx, { workspaceId: ws2 })).id;
			await seedDevice(tx, { workspaceId: ws2, clientId: client2 });

			const result = await paginatedDeviceQueryHandler({
				query: {
					workspaceId: ws1,
					paginationRequest: { limit: 10, orderBy: "brand", direction: "asc" },
				},
				repository: deviceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(result.value.items[0]?.clientId).toBe(client1);
		});
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
			await runTestInTransaction(async (tx) => {
				const workspaceId = await seedWorkspace(tx);
				const clientId = (await seedClient(tx, { workspaceId })).id;

				await seedDevice(tx, {
					workspaceId,
					clientId,
					...scenario.values,
				});

				await seedDevice(tx, {
					workspaceId,
					clientId,
					brand: "Samsung",
					model: "Galaxy",
					serialNumber: "SN-002",
				});

				await seedDevice(tx, {
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
					repository: deviceDrizzleRepository(tx),
				});

				expect(result.isSuccess).toBe(true);

				const ordered = result.value.items.map(
					(device) => device[scenario.orderBy],
				);

				expect(ordered).toEqual(scenario.expectedAsc);
			});
		});

		test(`Should sort by ${scenario.name} desc`, async () => {
			await runTestInTransaction(async (tx) => {
				const workspaceId = await seedWorkspace(tx);
				const clientId = (await seedClient(tx, { workspaceId })).id;

				await seedDevice(tx, {
					workspaceId,
					clientId,
					...scenario.values,
				});

				await seedDevice(tx, {
					workspaceId,
					clientId,
					brand: "Samsung",
					model: "Galaxy",
					serialNumber: "SN-002",
				});

				await seedDevice(tx, {
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
					repository: deviceDrizzleRepository(tx),
				});

				expect(result.isSuccess).toBe(true);

				const ordered = result.value.items.map(
					(device) => device[scenario.orderBy],
				);

				expect(ordered).toEqual([...scenario.expectedAsc].reverse());
			});
		});
	}

	test("Should sort by id asc", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;

			const d1 = await seedDevice(tx, {
				workspaceId,
				clientId,
				id: "00000000000000000000000001",
			});
			const d2 = await seedDevice(tx, {
				workspaceId,
				clientId,
				id: "00000000000000000000000002",
			});
			const d3 = await seedDevice(tx, {
				workspaceId,
				clientId,
				id: "00000000000000000000000003",
			});

			const result = await paginatedDeviceQueryHandler({
				query: {
					workspaceId,
					paginationRequest: { limit: 10, orderBy: "id", direction: "asc" },
				},
				repository: deviceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items.map((d) => d.id)).toEqual([
				d1.id,
				d2.id,
				d3.id,
			]);
		});
	});

	test("should paginate only devices belonging to the specified client", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			const clientAId = (
				await seedClient(tx, {
					workspaceId,
					phoneNumber: "+5215551000001",
					email: "client-a@example.com",
				})
			).id;

			const clientBId = (
				await seedClient(tx, {
					workspaceId,
					phoneNumber: "+5215551000002",
					email: "client-b@example.com",
				})
			).id;

			const clientADevices = await Promise.all(
				Array.from({ length: 5 }, (_, index) =>
					seedDevice(tx, {
						workspaceId,
						clientId: clientAId,
						id: ulid(),
						serialNumber: `A-${index}`,
					}),
				),
			);

			await Promise.all(
				Array.from({ length: 5 }, (_, index) =>
					seedDevice(tx, {
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
					repository: deviceDrizzleRepository(tx),
				});

				expect(response.isSuccess).toBe(true);

				const page = response.value;

				expect(
					page.items.every((device) => device.clientId === clientAId),
				).toBe(true);

				result.push(...page.items);

				cursor = page.cursor ?? undefined;
				hasNextPage = page.hasNextPage;
			}

			expect(result).toHaveLength(clientADevices.length);

			expect(result.every((device) => device.clientId === clientAId)).toBe(
				true,
			);

			expect(new Set(result.map((device) => device.id))).toHaveLength(
				clientADevices.length,
			);
		});
	});

	// ── D. Search ────────────────────────────────────────────────────

	test("Should filter by search across brand, model and serialNumber", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;

			await seedDevice(tx, {
				workspaceId,
				clientId,
				brand: "Samsung",
				model: "Galaxy",
				serialNumber: "SN-ABC",
			});
			await seedDevice(tx, {
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
				repository: deviceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(1);
			expect(first(result.value.items).model).toBe("Galaxy");
		});
	});

	test("Should return empty when search has no matches", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;

			await seedDevice(tx, {
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
				repository: deviceDrizzleRepository(tx),
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
			const clientId = (await seedClient(tx, { workspaceId })).id;

			await seedDevice(tx, { workspaceId, clientId, brand: "A" });
			await seedDevice(tx, { workspaceId, clientId, brand: "B" });
			await seedDevice(tx, { workspaceId, clientId, brand: "C" });

			const result = await paginatedDeviceQueryHandler({
				query: {
					workspaceId,
					paginationRequest: { limit: 2, orderBy: "brand", direction: "asc" },
				},
				repository: deviceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(2);
			expect(result.value.hasNextPage).toBe(true);
			expect(result.value.cursor).not.toBeNull();
			expect(first(result.value.items).brand).toBe("A");
			expect(result.value.items[1]?.brand).toBe("B");
		});
	});

	test("Should return the second page via cursor", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;

			await seedDevice(tx, { workspaceId, clientId, brand: "A" });
			await seedDevice(tx, { workspaceId, clientId, brand: "B" });
			await seedDevice(tx, { workspaceId, clientId, brand: "C" });

			const page1 = await paginatedDeviceQueryHandler({
				query: {
					workspaceId,
					paginationRequest: { limit: 2, orderBy: "brand", direction: "asc" },
				},
				repository: deviceDrizzleRepository(tx),
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
				repository: deviceDrizzleRepository(tx),
			});

			expect(page2.isSuccess).toBe(true);
			expect(page2.value.items).toHaveLength(1);
			expect(first(page2.value.items).brand).toBe("C");
			expect(page2.value.hasNextPage).toBe(false);
			expect(page2.value.cursor).toBeNull();
		});
	});

	test("Should set hasNextPage=false when items are within limit", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;

			await seedDevice(tx, { workspaceId, clientId, brand: "A" });
			await seedDevice(tx, { workspaceId, clientId, brand: "B" });

			const result = await paginatedDeviceQueryHandler({
				query: {
					workspaceId,
					paginationRequest: { limit: 5, orderBy: "brand", direction: "asc" },
				},
				repository: deviceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.items).toHaveLength(2);
			expect(result.value.hasNextPage).toBe(false);
			expect(result.value.cursor).toBeNull();
		});
	});

	test("Should paginate without duplicates or skips on tie-breaking by id", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;

			const d1 = await seedDevice(tx, {
				workspaceId,
				clientId,
				brand: "Same",
				id: "00000000000000000000000001",
			});
			const d2 = await seedDevice(tx, {
				workspaceId,
				clientId,
				brand: "Same",
				id: "00000000000000000000000002",
			});
			const d3 = await seedDevice(tx, {
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
				repository: deviceDrizzleRepository(tx),
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
				repository: deviceDrizzleRepository(tx),
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
});
