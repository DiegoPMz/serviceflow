import { describe, expect, test } from "bun:test";
import { seedClient } from "@serviceflow/backend/shared/database/seeds/client.seeds";
import { seedDevice } from "@serviceflow/backend/shared/database/seeds/device.seeds";
import { seedOrder } from "@serviceflow/backend/shared/database/seeds/order.seeds";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import { seedWorkspace } from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { ClientErrors } from "./common/client.errors";
import { clientDrizzleRepository } from "./common/client-drizzle-repository";
import { getClientHandler } from "./get-client";

describe("Get-Client Integration Tests", () => {
	test("Should return CLIENT_NOT_FOUND when the client does not exist", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			const result = await getClientHandler({
				query: { workspaceId, clientId: "01H8X5Y9Z0123456789ABCDEF9" },
				repository: clientDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(ClientErrors.CLIENT_NOT_FOUND.code);
		});
	});

	test("Should return CLIENT_NOT_FOUND when the client belongs to another workspace", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const otherWorkspaceId = await seedWorkspace(tx);
			const client = await seedClient(tx, { workspaceId: otherWorkspaceId });

			const result = await getClientHandler({
				query: { workspaceId, clientId: client.id },
				repository: clientDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(ClientErrors.CLIENT_NOT_FOUND.code);
		});
	});

	test("Should return the client with zero orders when it has no orders", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const client = await seedClient(tx, {
				workspaceId,
				name: "Juan Pérez",
				email: "juan@example.com",
				phoneNumber: "+5215551234567",
				location: "CDMX",
			});

			const result = await getClientHandler({
				query: { workspaceId, clientId: client.id },
				repository: clientDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value).toEqual({
				id: client.id,
				name: "Juan Pérez",
				email: "juan@example.com",
				phoneNumber: "+5215551234567",
				location: "CDMX",
				ordersCount: 0,
				lastOrder: null,
			});
		});
	});

	test("Should return ordersCount and the latest lastOrder for the client", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const client = await seedClient(tx, { workspaceId });
			const otherClient = await seedClient(tx, { workspaceId });
			const device = await seedDevice(tx, {
				workspaceId,
				clientId: client.id,
			});
			const userId = await seedUser(tx);

			const earlier = new Date("2026-01-01T10:00:00.000Z");
			const latest = new Date("2026-02-01T10:00:00.000Z");

			await seedOrder(tx, {
				workspaceId,
				clientId: client.id,
				deviceId: device.id,
				userId,
				createdAt: earlier,
				updatedAt: earlier,
			});
			await seedOrder(tx, {
				workspaceId,
				clientId: client.id,
				deviceId: device.id,
				userId,
				createdAt: latest,
				updatedAt: latest,
			});
			await seedOrder(tx, {
				workspaceId,
				clientId: otherClient.id,
				deviceId: device.id,
				userId,
				createdAt: new Date("2026-03-01T10:00:00.000Z"),
			});

			const result = await getClientHandler({
				query: { workspaceId, clientId: client.id },
				repository: clientDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.ordersCount).toBe(2);
			expect(result.value.lastOrder).toBe(latest.toISOString());
		});
	});
});
