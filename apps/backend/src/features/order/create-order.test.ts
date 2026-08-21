import { describe, expect, test } from "bun:test";
import {
	type DatabaseClient,
	deviceComponents,
	devices,
	orderComponents,
	orders,
	workspaces,
} from "@serviceflow/backend/shared/database";
import { seedClient } from "@serviceflow/backend/shared/database/seeds/client.seeds";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import {
	addMember,
	seedWorkspace,
} from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { eq } from "drizzle-orm";
import { ulid } from "ulidx";
import { ClientErrors } from "../client/common/client.errors";
import { clientDrizzleRepository } from "../client/common/client-drizzle-repository";
import { DeviceErrors } from "../device/common/device.errors";
import type { ComponentType } from "../device/common/device.model";
import { deviceDrizzleRepository } from "../device/common/device-drizzle-repository";
import { userDrizzleRepository } from "../user/common/user-drizzle-repository";
import { workspaceDrizzleRepository } from "../workspace/common/workspace-drizzle-repository";
import { OrderErrors } from "./common/order.errors";
import { OrderDrizzleRepository } from "./common/order-drizzle-repository";
import { type CreateOrderCommand, createOrderHandler } from "./create-order";

const seedDeviceWithComponents = async (
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
	overrides: Partial<CreateOrderCommand> = {},
): CreateOrderCommand => ({
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
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const { deviceId, componentIds } = await seedDeviceWithComponents(
				tx,
				workspaceId,
				clientId,
			);

			const result = await createOrderHandler({
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
				userRepository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value).toBeString();

			const [order] = await tx
				.select()
				.from(orders)
				.where(eq(orders.workspaceId, workspaceId));

			expect(order?.clientId).toBe(clientId);
			expect(order?.userId).toBe(userId);
			expect(order?.observations).toBe("Pantalla rota");
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
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const { deviceId } = await seedDeviceWithComponents(
				tx,
				workspaceId,
				clientId,
			);

			const result = await createOrderHandler({
				command: validCommand(workspaceId, userId, clientId, deviceId, []),
				orderRepository: OrderDrizzleRepository(tx),
				clientRepository: clientDrizzleRepository(tx),
				deviceRepository: deviceDrizzleRepository(tx),
				workspaceRepository: workspaceDrizzleRepository(tx),
				userRepository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value).toBeString();

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
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const { deviceId, componentIds } = await seedDeviceWithComponents(
				tx,
				workspaceId,
				clientId,
			);

			const first = await createOrderHandler({
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
				userRepository: userDrizzleRepository(tx),
			});
			expect(first.isSuccess).toBe(true);
			expect(first.value).toBeString();

			const second = await createOrderHandler({
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
				userRepository: userDrizzleRepository(tx),
			});
			expect(second.isSuccess).toBe(true);
			expect(second.value).toBeString();

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
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });
			const { deviceId, componentIds } = await seedDeviceWithComponents(
				tx,
				workspaceId,
				(await seedClient(tx, { workspaceId })).id,
			);

			const result = await createOrderHandler({
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
				userRepository: userDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(ClientErrors.CLIENT_NOT_FOUND.code);

			const storedOrders = await tx.select().from(orders);
			expect(storedOrders.length).toBe(0);
		});
	});

	test("Should return DEVICE_NOT_FOUND when device does not exist", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });
			const clientId = (await seedClient(tx, { workspaceId })).id;

			const result = await createOrderHandler({
				command: validCommand(workspaceId, userId, clientId, ulid(), []),
				orderRepository: OrderDrizzleRepository(tx),
				clientRepository: clientDrizzleRepository(tx),
				deviceRepository: deviceDrizzleRepository(tx),
				workspaceRepository: workspaceDrizzleRepository(tx),
				userRepository: userDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(DeviceErrors.DEVICE_NOT_FOUND.code);

			const storedOrders = await tx.select().from(orders);
			expect(storedOrders.length).toBe(0);
		});
	});

	test("Should return DEVICE_COMPONENT_NOT_FOUND for a component that belongs to another device", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const { deviceId } = await seedDeviceWithComponents(
				tx,
				workspaceId,
				clientId,
			);
			const otherDevice = await seedDeviceWithComponents(
				tx,
				workspaceId,
				clientId,
			);

			const result = await createOrderHandler({
				command: validCommand(workspaceId, userId, clientId, deviceId, [
					otherDevice.componentIds[0] as string,
				]),
				orderRepository: OrderDrizzleRepository(tx),
				clientRepository: clientDrizzleRepository(tx),
				deviceRepository: deviceDrizzleRepository(tx),
				workspaceRepository: workspaceDrizzleRepository(tx),
				userRepository: userDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(
				DeviceErrors.DEVICE_COMPONENT_NOT_FOUND(
					otherDevice.componentIds[0] as string,
				).code,
			);

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
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const { deviceId } = await seedDeviceWithComponents(
				tx,
				workspaceId,
				clientId,
			);

			const nonExistendComponentId = ulid();

			const result = await createOrderHandler({
				command: validCommand(workspaceId, userId, clientId, deviceId, [
					nonExistendComponentId,
				]),
				orderRepository: OrderDrizzleRepository(tx),
				clientRepository: clientDrizzleRepository(tx),
				deviceRepository: deviceDrizzleRepository(tx),
				workspaceRepository: workspaceDrizzleRepository(tx),
				userRepository: userDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(
				DeviceErrors.DEVICE_COMPONENT_NOT_FOUND(nonExistendComponentId).code,
			);
		});
	});

	test("Should return ORDER_COMPONENT_QUANTITY_INVALID when quantity is zero or negative", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const { deviceId, componentIds } = await seedDeviceWithComponents(
				tx,
				workspaceId,
				clientId,
			);

			const result = await createOrderHandler({
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
				userRepository: userDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(
				OrderErrors.ORDER_COMPONENT_QUANTITY_INVALID.code,
			);

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
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const { deviceId, componentIds } = await seedDeviceWithComponents(
				tx,
				workspaceId,
				clientId,
			);

			const result = await createOrderHandler({
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
				userRepository: userDrizzleRepository(tx),
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
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const { deviceId, componentIds } = await seedDeviceWithComponents(
				tx,
				workspaceId,
				clientId,
			);

			const result = await createOrderHandler({
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
				userRepository: userDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("ORDER_ISSUE_OBSERVATION_TOO_LONG");
		});
	});

	test("Should return FOLIO_WORKSPACE_ORDER_COUNT_NEGATIVE when workspace count is negative", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx, { orderCount: -1 });
			await addMember(tx, { userId, workspaceId });
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const { deviceId, componentIds } = await seedDeviceWithComponents(
				tx,
				workspaceId,
				clientId,
			);

			const result = await createOrderHandler({
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
				userRepository: userDrizzleRepository(tx),
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
			const workspaceId = await seedWorkspace(tx, { prefix: " " });
			await addMember(tx, { userId, workspaceId });
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const { deviceId, componentIds } = await seedDeviceWithComponents(
				tx,
				workspaceId,
				clientId,
			);

			const result = await createOrderHandler({
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
				userRepository: userDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("FOLIO_WORKSPACE_PREFIX_REQUIRED");

			const storedOrders = await tx.select().from(orders);
			expect(storedOrders.length).toBe(0);
		});
	});
});
