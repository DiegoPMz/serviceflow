import { describe, expect, test } from "bun:test";
import {
	type DatabaseClient,
	orders,
	workspaceActivities,
} from "@serviceflow/backend/shared/database";
import { seedClient } from "@serviceflow/backend/shared/database/seeds/client.seeds";
import { seedDevice } from "@serviceflow/backend/shared/database/seeds/device.seeds";
import { seedOrder } from "@serviceflow/backend/shared/database/seeds/order.seeds";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import {
	addMember,
	seedWorkspace,
} from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { ORDER_ERROR_CODES, USER_ERROR_CODES } from "@serviceflow/error-codes";
import { and, eq } from "drizzle-orm";
import { ulid } from "ulidx";
import { userDrizzleRepository } from "../user/common/user-drizzle-repository";
import {
	type ChangeOrderStatusCommand,
	changeOrderStatusHandler,
} from "./change-order-status";
import { OrderDrizzleRepository } from "./common/order-drizzle-repository";
import { createDrizzleOrdersUnitOfWork } from "./common/orders-drizzle.unit-of-work";

const changeStatus = (tx: DatabaseClient, command: ChangeOrderStatusCommand) =>
	changeOrderStatusHandler({
		command,
		orderRepository: OrderDrizzleRepository(tx),
		userRepository: userDrizzleRepository(tx),
		unitOfWork: createDrizzleOrdersUnitOfWork(tx),
	});

const getOrderActivities = (tx: DatabaseClient, workspaceId: string) =>
	tx
		.select()
		.from(workspaceActivities)
		.where(
			and(
				eq(workspaceActivities.workspaceId, workspaceId),
				eq(workspaceActivities.type, "ORDER_STATUS_CHANGED"),
			),
		);

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

			const result = await changeStatus(tx, {
				workspaceId,
				userId,
				orderId,
				status: "entregada",
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

	test("Should record an ORDER_STATUS_CHANGED activity with previous and new status", async () => {
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

			const result = await changeStatus(tx, {
				workspaceId,
				userId,
				orderId,
				status: "entregada",
			});

			expect(result.isSuccess).toBe(true);

			const [storedOrder] = await tx
				.select()
				.from(orders)
				.where(eq(orders.id, orderId));

			const activities = await getOrderActivities(tx, workspaceId);

			expect(activities.length).toBe(1);
			expect(activities[0]?.entityId).toBe(orderId);
			expect(activities[0]?.entityLabel).toBe(storedOrder?.folio);
			expect(activities[0]?.actorUserId).toBe(userId);
			expect(activities[0]?.actorNameSnapshot).toBe("Test User Perez");
			expect(activities[0]?.metadata).toEqual({
				previousStatus: "pendiente",
				newStatus: "entregada",
			});
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

			const result = await changeStatus(tx, {
				workspaceId,
				userId,
				orderId,
				status: "cancelada",
			});

			expect(result.isSuccess).toBe(true);

			const [after] = await tx
				.select()
				.from(orders)
				.where(eq(orders.id, orderId));
			expect(after?.status).toBe("cancelada");

			const activities = await getOrderActivities(tx, workspaceId);
			expect(activities.length).toBe(1);
			expect(activities[0]?.metadata).toEqual({
				previousStatus: "pendiente",
				newStatus: "cancelada",
			});
		});
	});

	test("Should return ORDER_NOT_FOUND when the order does not exist", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);

			const result = await changeStatus(tx, {
				workspaceId,
				userId,
				orderId: "01H8X5Y9Z0123456789ABCDEFX",
				status: "entregada",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(ORDER_ERROR_CODES.NOT_FOUND);

			const activities = await getOrderActivities(tx, workspaceId);
			expect(activities.length).toBe(0);
		});
	});

	test("Should return ORDER_NOT_FOUND when the order belongs to another workspace", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx, { name: "WORKSPACE-1" });
			const otherWorkspaceId = await seedWorkspace(tx, { name: "WORKSPACE-2" });
			await addMember(tx, { userId, workspaceId });
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const deviceId = (await seedDevice(tx, { workspaceId, clientId })).id;
			const orderId = await seedOrder(tx, {
				workspaceId,
				clientId,
				deviceId,
				userId,
			});

			const result = await changeStatus(tx, {
				workspaceId: otherWorkspaceId,
				userId,
				orderId,
				status: "entregada",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(ORDER_ERROR_CODES.NOT_FOUND);

			const [storedOrder] = await tx
				.select()
				.from(orders)
				.where(eq(orders.id, orderId));
			expect(storedOrder?.status).toBe("pendiente");

			const activities = await getOrderActivities(tx, otherWorkspaceId);
			expect(activities.length).toBe(0);
		});
	});

	test("Should return USER_NOT_FOUND when the user does not exist and not change the status", async () => {
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

			const result = await changeStatus(tx, {
				workspaceId,
				userId: ulid(),
				orderId,
				status: "entregada",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(USER_ERROR_CODES.NOT_FOUND);

			const [storedOrder] = await tx
				.select()
				.from(orders)
				.where(eq(orders.id, orderId));
			expect(storedOrder?.status).toBe("pendiente");

			const activities = await getOrderActivities(tx, workspaceId);
			expect(activities.length).toBe(0);
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

			const deliver = await changeStatus(tx, {
				workspaceId,
				userId,
				orderId,
				status: "entregada",
			});
			expect(deliver.isSuccess).toBe(true);

			const result = await changeStatus(tx, {
				workspaceId,
				userId,
				orderId,
				status: "entregada",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(ORDER_ERROR_CODES.ALREADY_DELIVERED);

			const [row] = await tx
				.select()
				.from(orders)
				.where(eq(orders.id, orderId));
			expect(row?.status).toBe("entregada");

			const activities = await getOrderActivities(tx, workspaceId);
			expect(activities.length).toBe(1);
		});
	});
});
