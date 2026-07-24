import { describe, expect, test } from "bun:test";
import {
	type DatabaseClient,
	type DatabaseType,
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
import { clientDrizzleRepository } from "../client/common/client-drizzle-repository";
import type { ComponentType } from "../device/common/device.model";
import { deviceDrizzleRepository } from "../device/common/device-drizzle-repository";
import { userDrizzleRepository } from "../user/common/user-drizzle-repository";
import { workspaceDrizzleRepository } from "../workspace/common/workspace-drizzle-repository";
import { OrderDrizzleRepository } from "./common/order-drizzle-repository";
import {
	type CreateOrderCommand,
	createOrderCommandHandler,
} from "./create-order";

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
				userRepository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);

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

			const result = await createOrderCommandHandler({
				command: validCommand(workspaceId, userId, clientId, deviceId, []),
				orderRepository: OrderDrizzleRepository(tx),
				clientRepository: clientDrizzleRepository(tx),
				deviceRepository: deviceDrizzleRepository(tx),
				workspaceRepository: workspaceDrizzleRepository(tx),
				userRepository: userDrizzleRepository(tx),
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
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const { deviceId, componentIds } = await seedDeviceWithComponents(
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
				userRepository: userDrizzleRepository(tx),
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
				userRepository: userDrizzleRepository(tx),
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
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });
			const { deviceId, componentIds } = await seedDeviceWithComponents(
				tx,
				workspaceId,
				(await seedClient(tx, { workspaceId })).id,
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
				userRepository: userDrizzleRepository(tx),
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
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });
			const clientId = (await seedClient(tx, { workspaceId })).id;

			const result = await createOrderCommandHandler({
				command: validCommand(workspaceId, userId, clientId, ulid(), []),
				orderRepository: OrderDrizzleRepository(tx),
				clientRepository: clientDrizzleRepository(tx),
				deviceRepository: deviceDrizzleRepository(tx),
				workspaceRepository: workspaceDrizzleRepository(tx),
				userRepository: userDrizzleRepository(tx),
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

			const result = await createOrderCommandHandler({
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
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const { deviceId } = await seedDeviceWithComponents(
				tx,
				workspaceId,
				clientId,
			);

			const result = await createOrderCommandHandler({
				command: validCommand(workspaceId, userId, clientId, deviceId, [
					ulid(),
				]),
				orderRepository: OrderDrizzleRepository(tx),
				clientRepository: clientDrizzleRepository(tx),
				deviceRepository: deviceDrizzleRepository(tx),
				workspaceRepository: workspaceDrizzleRepository(tx),
				userRepository: userDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("DEVICE_COMPONENT_NOT_FOUND");
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
				userRepository: userDrizzleRepository(tx),
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
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const { deviceId, componentIds } = await seedDeviceWithComponents(
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
				userRepository: userDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("FOLIO_WORKSPACE_PREFIX_REQUIRED");

			const storedOrders = await tx.select().from(orders);
			expect(storedOrders.length).toBe(0);
		});
	});
});
