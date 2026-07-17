import { describe, expect, test } from "bun:test";
import {
	clients,
	type DatabaseClient,
	deviceComponents,
	devices,
	orderComponents,
	orders,
	users,
	workspaceMembers,
	workspaces,
} from "@serviceflow/backend/shared/database";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { eq } from "drizzle-orm";
import { ulid } from "ulidx";
import { clientDrizzleRepository } from "../client/common/client-drizzle-repository";
import type { ComponentType } from "../device/common/device.model";
import { deviceDrizzleRepository } from "../device/common/device-drizzle-repository";
import { workspaceDrizzleRepository } from "../workspace/common/workspace-drizzle-repository";
import { OrderDrizzleRepository } from "./common/order-drizzle-repository";
import { createOrderCommandHandler } from "./create-order";

const seedUser = async (tx: DatabaseClient) => {
	const userId = ulid();
	await tx.insert(users).values({
		id: userId,
		name: "Test User",
		email: `user-${userId}@example.com`,
	});
	return userId;
};

const seedWorkspace = async (
	tx: DatabaseClient,
	prefix = "TEST",
	orderCount = 0,
	userId: string,
) => {
	const workspaceId = ulid();
	await tx.insert(workspaces).values({
		id: workspaceId,
		name: "Test Workspace",
		prefix,
		orderCount,
	});

	await tx.insert(workspaceMembers).values({
		userId,
		workspaceId,
		role: "owner",
	});

	return workspaceId;
};

const seedClient = async (tx: DatabaseClient, workspaceId: string) => {
	const clientId = ulid();
	await tx.insert(clients).values({
		id: clientId,
		workspaceId,
		name: "Test Client",
		phoneNumber: "+5215551234567",
		email: `client-${clientId}@example.com`,
		location: "CDMX",
	});
	return clientId;
};

const seedDevice = async (
	tx: DatabaseClient,
	workspaceId: string,
	clientId: string,
) => {
	const deviceId = ulid();
	await tx.insert(devices).values({
		id: deviceId,
		workspaceId,
		clientId,
		serialNumber: `SN-${ulid()}`,
		brand: "Samsung",
		model: "Galaxy S21",
	});

	const componentIds: string[] = [];
	for (const component of [
		{ name: "Batería", partNumber: "BAT-001", type: "supply" as ComponentType },
		{
			name: "Pantalla",
			partNumber: "SCR-001",
			type: "replacement_part" as ComponentType,
		},
	]) {
		const componentId = ulid();
		await tx.insert(deviceComponents).values({
			id: componentId,
			deviceId,
			name: component.name,
			partNumber: component.partNumber,
			type: component.type,
		});
		componentIds.push(componentId);
	}

	return { deviceId, componentIds };
};

const validCommand = (
	workspaceId: string,
	userId: string,
	clientId: string,
	deviceId: string,
	componentIds: string[],
	overrides: Record<string, unknown> = {},
) => ({
	workspaceId,
	userId,
	clientId,
	deviceId,
	components: componentIds.map((id) => ({ id, quantity: 1 })),
	observations: "Pantalla rota",
	...overrides,
});

describe("Create-Order Integration Tests", () => {
	test("Should create an order with components and increment workspace count", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx, undefined, undefined, userId);
			const clientId = await seedClient(tx, workspaceId);
			const { deviceId, componentIds } = await seedDevice(
				tx,
				workspaceId,
				clientId,
			);

			const result = await createOrderCommandHandler({
				command: validCommand(
					workspaceId,
					userId,
					clientId,
					deviceId,
					componentIds,
				),
				orderRepository: OrderDrizzleRepository(tx),
				clientRepository: clientDrizzleRepository(tx),
				deviceRepository: deviceDrizzleRepository(tx),
				workspaceRepository: workspaceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);

			const [order] = await tx
				.select()
				.from(orders)
				.where(eq(orders.workspaceId, workspaceId));

			expect(order?.clientId).toBe(clientId);
			expect(order?.userId).toBe(userId);
			expect(order?.observations).toBe("Pantalla rota");
			expect(order?.clientNameSnapshot).toBe("Test Client");
			expect(order?.clientPhoneSnapshot).toBe("+5215551234567");
			expect(order?.clientEmailSnapshot).toBe(`client-${clientId}@example.com`);
			expect(order?.clientLocationSnapshot).toBe("CDMX");
			expect(order?.deviceBrandSnapshot).toBe("Samsung");
			expect(order?.deviceModelSnapshot).toBe("Galaxy S21");
			expect(order?.createdAt).toBeInstanceOf(Date);
			expect(order?.updatedAt).toBeInstanceOf(Date);

			const storedComponents = await tx
				.select()
				.from(orderComponents)
				.where(eq(orderComponents.orderId, order?.id as string));

			expect(storedComponents.length).toBe(2);
			expect(storedComponents.every((c) => c.quantity === 1)).toBe(true);

			const [workspace] = await tx
				.select()
				.from(workspaces)
				.where(eq(workspaces.id, workspaceId));
			expect(workspace?.orderCount).toBe(1);
		});
	});

	test("Should create an order without components", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx, undefined, undefined, userId);
			const clientId = await seedClient(tx, workspaceId);
			const { deviceId } = await seedDevice(tx, workspaceId, clientId);

			const result = await createOrderCommandHandler({
				command: validCommand(workspaceId, userId, clientId, deviceId, []),
				orderRepository: OrderDrizzleRepository(tx),
				clientRepository: clientDrizzleRepository(tx),
				deviceRepository: deviceDrizzleRepository(tx),
				workspaceRepository: workspaceDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);

			const storedOrders = await tx
				.select()
				.from(orders)
				.where(eq(orders.workspaceId, workspaceId));
			expect(storedOrders.length).toBe(1);

			const storedComponents = await tx
				.select()
				.from(orderComponents)
				.where(eq(orderComponents.orderId, storedOrders[0]?.id as string));
			expect(storedComponents.length).toBe(0);
		});
	});

	test("Should create a second order and increment the workspace count again", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx, undefined, undefined, userId);
			const clientId = await seedClient(tx, workspaceId);
			const { deviceId, componentIds } = await seedDevice(
				tx,
				workspaceId,
				clientId,
			);

			const first = await createOrderCommandHandler({
				command: validCommand(
					workspaceId,
					userId,
					clientId,
					deviceId,
					componentIds,
				),
				orderRepository: OrderDrizzleRepository(tx),
				clientRepository: clientDrizzleRepository(tx),
				deviceRepository: deviceDrizzleRepository(tx),
				workspaceRepository: workspaceDrizzleRepository(tx),
			});
			expect(first.isSuccess).toBe(true);

			const second = await createOrderCommandHandler({
				command: validCommand(
					workspaceId,
					userId,
					clientId,
					deviceId,
					componentIds,
				),
				orderRepository: OrderDrizzleRepository(tx),
				clientRepository: clientDrizzleRepository(tx),
				deviceRepository: deviceDrizzleRepository(tx),
				workspaceRepository: workspaceDrizzleRepository(tx),
			});
			expect(second.isSuccess).toBe(true);

			const storedOrders = await tx
				.select()
				.from(orders)
				.where(eq(orders.workspaceId, workspaceId));
			expect(storedOrders.length).toBe(2);

			const [workspace] = await tx
				.select()
				.from(workspaces)
				.where(eq(workspaces.id, workspaceId));
			expect(workspace?.orderCount).toBe(2);
		});
	});

	test("Should return CLIENT_NOT_FOUND when client does not exist", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx, undefined, undefined, userId);
			const { deviceId, componentIds } = await seedDevice(
				tx,
				workspaceId,
				await seedClient(tx, workspaceId),
			);

			const result = await createOrderCommandHandler({
				command: validCommand(
					workspaceId,
					userId,
					ulid(),
					deviceId,
					componentIds,
				),
				orderRepository: OrderDrizzleRepository(tx),
				clientRepository: clientDrizzleRepository(tx),
				deviceRepository: deviceDrizzleRepository(tx),
				workspaceRepository: workspaceDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("CLIENT_NOT_FOUND");

			const storedOrders = await tx.select().from(orders);
			expect(storedOrders.length).toBe(0);
		});
	});

	test("Should return DEVICE_NOT_FOUND when device does not exist", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx, undefined, undefined, userId);
			const clientId = await seedClient(tx, workspaceId);

			const result = await createOrderCommandHandler({
				command: validCommand(workspaceId, userId, clientId, ulid(), []),
				orderRepository: OrderDrizzleRepository(tx),
				clientRepository: clientDrizzleRepository(tx),
				deviceRepository: deviceDrizzleRepository(tx),
				workspaceRepository: workspaceDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("DEVICE_NOT_FOUND");

			const storedOrders = await tx.select().from(orders);
			expect(storedOrders.length).toBe(0);
		});
	});

	test("Should return DEVICE_COMPONENT_NOT_FOUND for a component that belongs to another device", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx, undefined, undefined, userId);
			const clientId = await seedClient(tx, workspaceId);
			const { deviceId } = await seedDevice(tx, workspaceId, clientId);
			const otherDevice = await seedDevice(tx, workspaceId, clientId);

			const result = await createOrderCommandHandler({
				command: validCommand(workspaceId, userId, clientId, deviceId, [
					otherDevice.componentIds[0] as string,
				]),
				orderRepository: OrderDrizzleRepository(tx),
				clientRepository: clientDrizzleRepository(tx),
				deviceRepository: deviceDrizzleRepository(tx),
				workspaceRepository: workspaceDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("DEVICE_COMPONENT_NOT_FOUND");

			const storedOrders = await tx.select().from(orders);
			expect(storedOrders.length).toBe(0);

			const [workspace] = await tx
				.select()
				.from(workspaces)
				.where(eq(workspaces.id, workspaceId));
			expect(workspace?.orderCount).toBe(0);
		});
	});

	test("Should return DEVICE_COMPONENT_NOT_FOUND for a non-existent component", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx, undefined, undefined, userId);
			const clientId = await seedClient(tx, workspaceId);
			const { deviceId } = await seedDevice(tx, workspaceId, clientId);

			const result = await createOrderCommandHandler({
				command: validCommand(workspaceId, userId, clientId, deviceId, [
					ulid(),
				]),
				orderRepository: OrderDrizzleRepository(tx),
				clientRepository: clientDrizzleRepository(tx),
				deviceRepository: deviceDrizzleRepository(tx),
				workspaceRepository: workspaceDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("DEVICE_COMPONENT_NOT_FOUND");
		});
	});

	test("Should return ORDER_COMPONENT_QUANTITY_INVALID when quantity is zero or negative", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx, undefined, undefined, userId);
			const clientId = await seedClient(tx, workspaceId);
			const { deviceId, componentIds } = await seedDevice(
				tx,
				workspaceId,
				clientId,
			);

			const result = await createOrderCommandHandler({
				command: validCommand(
					workspaceId,
					userId,
					clientId,
					deviceId,
					componentIds,
					{
						components: componentIds.map((id) => ({ id, quantity: 0 })),
					},
				),
				orderRepository: OrderDrizzleRepository(tx),
				clientRepository: clientDrizzleRepository(tx),
				deviceRepository: deviceDrizzleRepository(tx),
				workspaceRepository: workspaceDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("ORDER_COMPONENT_QUANTITY_INVALID");

			const storedOrders = await tx.select().from(orders);
			expect(storedOrders.length).toBe(0);

			const [workspace] = await tx
				.select()
				.from(workspaces)
				.where(eq(workspaces.id, workspaceId));
			expect(workspace?.orderCount).toBe(0);
		});
	});

	test("Should return ORDER_ISSUE_OBSERVATION_REQUIRED when observations are empty", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx, undefined, undefined, userId);
			const clientId = await seedClient(tx, workspaceId);
			const { deviceId, componentIds } = await seedDevice(
				tx,
				workspaceId,
				clientId,
			);

			const result = await createOrderCommandHandler({
				command: validCommand(
					workspaceId,
					userId,
					clientId,
					deviceId,
					componentIds,
					{ observations: "" },
				),
				orderRepository: OrderDrizzleRepository(tx),
				clientRepository: clientDrizzleRepository(tx),
				deviceRepository: deviceDrizzleRepository(tx),
				workspaceRepository: workspaceDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("ORDER_ISSUE_OBSERVATION_REQUIRED");

			const storedOrders = await tx.select().from(orders);
			expect(storedOrders.length).toBe(0);
		});
	});

	test("Should return ORDER_ISSUE_OBSERVATION_TOO_LONG when observations exceed 1000 chars", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx, undefined, undefined, userId);
			const clientId = await seedClient(tx, workspaceId);
			const { deviceId, componentIds } = await seedDevice(
				tx,
				workspaceId,
				clientId,
			);

			const result = await createOrderCommandHandler({
				command: validCommand(
					workspaceId,
					userId,
					clientId,
					deviceId,
					componentIds,
					{ observations: "x".repeat(1001) },
				),
				orderRepository: OrderDrizzleRepository(tx),
				clientRepository: clientDrizzleRepository(tx),
				deviceRepository: deviceDrizzleRepository(tx),
				workspaceRepository: workspaceDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("ORDER_ISSUE_OBSERVATION_TOO_LONG");
		});
	});

	test("Should return FOLIO_WORKSPACE_ORDER_COUNT_NEGATIVE when workspace count is negative", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx, "TEST", -1, userId);
			const clientId = await seedClient(tx, workspaceId);
			const { deviceId, componentIds } = await seedDevice(
				tx,
				workspaceId,
				clientId,
			);

			const result = await createOrderCommandHandler({
				command: validCommand(
					workspaceId,
					userId,
					clientId,
					deviceId,
					componentIds,
				),
				orderRepository: OrderDrizzleRepository(tx),
				clientRepository: clientDrizzleRepository(tx),
				deviceRepository: deviceDrizzleRepository(tx),
				workspaceRepository: workspaceDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("FOLIO_WORKSPACE_ORDER_COUNT_NEGATIVE");

			const storedOrders = await tx.select().from(orders);
			expect(storedOrders.length).toBe(0);
		});
	});

	test("Should return FOLIO_WORKSPACE_PREFIX_REQUIRED when workspace prefix is empty", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx, "", 0, userId);
			const clientId = await seedClient(tx, workspaceId);
			const { deviceId, componentIds } = await seedDevice(
				tx,
				workspaceId,
				clientId,
			);

			const result = await createOrderCommandHandler({
				command: validCommand(
					workspaceId,
					userId,
					clientId,
					deviceId,
					componentIds,
				),
				orderRepository: OrderDrizzleRepository(tx),
				clientRepository: clientDrizzleRepository(tx),
				deviceRepository: deviceDrizzleRepository(tx),
				workspaceRepository: workspaceDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("FOLIO_WORKSPACE_PREFIX_REQUIRED");

			const storedOrders = await tx.select().from(orders);
			expect(storedOrders.length).toBe(0);
		});
	});
});
