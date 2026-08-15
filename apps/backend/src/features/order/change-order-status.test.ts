import { describe, expect, test } from "bun:test";
import { orders } from "@serviceflow/backend/shared/database";
import { seedClient } from "@serviceflow/backend/shared/database/seeds/client.seeds";
import { seedDevice } from "@serviceflow/backend/shared/database/seeds/device.seeds";
import { seedOrder } from "@serviceflow/backend/shared/database/seeds/order.seeds";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import {
	addMember,
	seedWorkspace,
} from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { eq } from "drizzle-orm";
import { changeOrderStatusHandler } from "./change-order-status";
import { OrderDrizzleRepository } from "./common/order-drizzle-repository";

describe("Change-Order-Status Integration Tests", () => {
	test("Should deliver a pending order and persist the status", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const deviceId = (await seedDevice(tx, { workspaceId, clientId })).id;
			const orderId = await seedOrder(tx, {
				workspaceId,
				clientId,
				deviceId,
				userId,
				updatedAt: new Date("2020-01-01T00:00:00Z"),
			});

			const [before] = await tx
				.select()
				.from(orders)
				.where(eq(orders.id, orderId));
			expect(before?.status).toBe("pendiente");

			const result = await changeOrderStatusHandler({
				command: { orderId, status: "entregada" },
				orderRepository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);

			const [after] = await tx
				.select()
				.from(orders)
				.where(eq(orders.id, orderId));
			expect(after?.status).toBe("entregada");
			expect((after?.updatedAt as Date).getTime()).toBeGreaterThan(
				(before?.updatedAt as Date).getTime(),
			);
		});
	});

	test("Should cancel a pending order and persist the status", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const deviceId = (await seedDevice(tx, { workspaceId, clientId })).id;
			const orderId = await seedOrder(tx, {
				workspaceId,
				clientId,
				deviceId,
				userId,
			});

			const result = await changeOrderStatusHandler({
				command: { orderId, status: "cancelada" },
				orderRepository: OrderDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);

			const [after] = await tx
				.select()
				.from(orders)
				.where(eq(orders.id, orderId));
			expect(after?.status).toBe("cancelada");
		});
	});

	test("Should return ORDER_NOT_FOUND when the order does not exist", async () => {
		await runTestInTransaction(async (tx) => {
			const result = await changeOrderStatusHandler({
				command: { orderId: "01H8X5Y9Z0123456789ABCDEFX", status: "entregada" },
				orderRepository: OrderDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("ORDER_NOT_FOUND");
		});
	});

	test("Should return ORDER_ALREADY_DELIVERED and not change the stored status", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const deviceId = (await seedDevice(tx, { workspaceId, clientId })).id;
			const orderId = await seedOrder(tx, {
				workspaceId,
				clientId,
				deviceId,
				userId,
			});

			const deliver = await changeOrderStatusHandler({
				command: { orderId, status: "entregada" },
				orderRepository: OrderDrizzleRepository(tx),
			});
			expect(deliver.isSuccess).toBe(true);

			const result = await changeOrderStatusHandler({
				command: { orderId, status: "entregada" },
				orderRepository: OrderDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("ORDER_ALREADY_DELIVERED");

			const [row] = await tx
				.select()
				.from(orders)
				.where(eq(orders.id, orderId));
			expect(row?.status).toBe("entregada");
		});
	});
});
