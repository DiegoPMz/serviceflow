import { describe, expect, test } from "bun:test";
import {
	type DatabaseClient,
	deviceComponents,
	devices,
	workspaceActivities,
} from "@serviceflow/backend/shared/database";
import { seedClient } from "@serviceflow/backend/shared/database/seeds/client.seeds";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import { seedWorkspace } from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { DEVICE_ERROR_CODES } from "@serviceflow/error-codes";
import { eq } from "drizzle-orm";
import { ulid } from "ulidx";
import { userDrizzleRepository } from "../user/common/user-drizzle-repository";
import type { ComponentType } from "./common/device.model";
import { deviceDrizzleRepository } from "./common/device-drizzle-repository";
import { createDrizzleDevicesUnitOfWork } from "./common/devices-drizzle.unit-of-work";
import {
	type RegisterDeviceCommand,
	registerDeviceHandler,
} from "./register-device";

const validCommand = (
	workspaceId: string,
	userId: string,
	clientId: string,
	overrides: Partial<RegisterDeviceCommand> = {},
): RegisterDeviceCommand => ({
	workspaceId,
	userId,
	clientId,
	serialNumber: `SN-${ulid()}`,
	brand: "Samsung",
	model: "Galaxy S21",
	components: [
		{ name: "Batería", partNumber: "BAT-001", type: "supply" as ComponentType },
	],
	...overrides,
});

const registerDevice = (tx: DatabaseClient, command: RegisterDeviceCommand) =>
	registerDeviceHandler({
		command,
		repository: deviceDrizzleRepository(tx),
		userRepository: userDrizzleRepository(tx),
		unitOfWork: createDrizzleDevicesUnitOfWork(tx),
	});

const getWorkspaceActivities = (tx: DatabaseClient, workspaceId: string) =>
	tx
		.select()
		.from(workspaceActivities)
		.where(eq(workspaceActivities.workspaceId, workspaceId));

describe("Register-Device Integration Tests", () => {
	test("Should register a device with a component and persist both", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const command = validCommand(workspaceId, userId, clientId);

			const result = await registerDevice(tx, command);

			expect(result.isSuccess).toBe(true);

			const [device] = await tx
				.select()
				.from(devices)
				.where(eq(devices.serialNumber, command.serialNumber));

			expect(device).toBeDefined();
			expect(device?.brand).toBe(command.brand);
			expect(device?.model).toBe(command.model);
			expect(device?.workspaceId).toBe(workspaceId);
			expect(device?.clientId).toBe(clientId);
			expect(device?.createdAt).toBeInstanceOf(Date);
			expect(device?.updatedAt).toBeInstanceOf(Date);

			const components = await tx
				.select()
				.from(deviceComponents)
				.where(eq(deviceComponents.deviceId, device?.id as string));

			expect(components.length).toBe(1);
			expect(components[0]?.name).toBe("Batería");
			expect(components[0]?.partNumber).toBe("BAT-001");
			expect(components[0]?.type).toBe("supply");
		});
	});

	test("Should record DEVICE_REGISTERED and CONSUMABLE_REGISTERED activities for a device with consumables", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const command = validCommand(workspaceId, userId, clientId);

			const result = await registerDevice(tx, command);

			expect(result.isSuccess).toBe(true);

			const activities = await getWorkspaceActivities(tx, workspaceId);

			expect(activities.length).toBe(2);

			const deviceActivity = activities.find(
				(activity) => activity.type === "DEVICE_REGISTERED",
			);
			const consumablesActivity = activities.find(
				(activity) => activity.type === "CONSUMABLE_REGISTERED",
			);

			expect(deviceActivity?.entityId).toBe(result.value as string);
			expect(deviceActivity?.entityLabel).toBe("Samsung Galaxy S21");
			expect(deviceActivity?.actorUserId).toBe(userId);
			expect(deviceActivity?.actorNameSnapshot).toBe("Test User Perez");
			expect(deviceActivity?.metadata).toBeNull();

			expect(consumablesActivity?.entityId).toBe(result.value as string);
			expect(consumablesActivity?.entityLabel).toBe("Samsung Galaxy S21");
			expect(consumablesActivity?.metadata).toEqual({ count: 1 });
		});
	});

	test("Should return DEVICE_ALREADY_EXISTS when serial is already registered in the workspace", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const command = validCommand(workspaceId, userId, clientId);

			await registerDevice(tx, command);

			const result = await registerDevice(
				tx,
				validCommand(workspaceId, userId, clientId, {
					serialNumber: command.serialNumber,
				}),
			);

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(DEVICE_ERROR_CODES.ALREADY_EXISTS);

			const rows = await tx
				.select()
				.from(devices)
				.where(eq(devices.serialNumber, command.serialNumber));
			expect(rows.length).toBe(1);

			const activities = await getWorkspaceActivities(tx, workspaceId);
			expect(activities.length).toBe(2);
		});
	});

	test("Should return DEVICE_BRAND_REQUIRED when brand is empty", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;

			const result = await registerDevice(
				tx,
				validCommand(workspaceId, userId, clientId, { brand: "" }),
			);

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(DEVICE_ERROR_CODES.BRAND_REQUIRED);

			const rows = await tx.select().from(devices);
			expect(rows.length).toBe(0);

			const activities = await getWorkspaceActivities(tx, workspaceId);
			expect(activities.length).toBe(0);
		});
	});

	test("Should return DEVICE_COMPONENT_NAME_REQUIRED when component name is empty", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;

			const result = await registerDevice(
				tx,
				validCommand(workspaceId, userId, clientId, {
					components: [
						{
							name: "",
							partNumber: "BAT-001",
							type: "supply" as ComponentType,
						},
					],
				}),
			);

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(
				DEVICE_ERROR_CODES.COMPONENT_NAME_REQUIRED,
			);

			const rows = await tx.select().from(devices);
			expect(rows.length).toBe(0);

			const activities = await getWorkspaceActivities(tx, workspaceId);
			expect(activities.length).toBe(0);
		});
	});

	test("Should return USER_NOT_FOUND and not persist anything when the user does not exist", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;

			const result = await registerDevice(
				tx,
				validCommand(workspaceId, ulid(), clientId),
			);

			expect(result.isFailure).toBe(true);

			const rows = await tx.select().from(devices);
			expect(rows.length).toBe(0);

			const activities = await getWorkspaceActivities(tx, workspaceId);
			expect(activities.length).toBe(0);
		});
	});

	test("Should register a device without components and only record DEVICE_REGISTERED", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;

			const command = validCommand(workspaceId, userId, clientId, {
				components: [],
			});
			const result = await registerDevice(tx, command);

			expect(result.isSuccess).toBe(true);

			const [device] = await tx
				.select()
				.from(devices)
				.where(eq(devices.serialNumber, command.serialNumber));

			const rows = await tx.select().from(devices);
			expect(rows.length).toBe(1);

			const components = await tx
				.select()
				.from(deviceComponents)
				.where(eq(deviceComponents.deviceId, device?.id as string));
			expect(components.length).toBe(0);

			const activities = await getWorkspaceActivities(tx, workspaceId);
			expect(activities.length).toBe(1);
			expect(activities[0]?.type).toBe("DEVICE_REGISTERED");
		});
	});

	test("Should register a device with multiple components of different types", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;

			const command = validCommand(workspaceId, userId, clientId, {
				components: [
					{
						name: "Batería",
						partNumber: "BAT-001",
						type: "supply" as ComponentType,
					},
					{
						name: "Pantalla",
						partNumber: "SCR-001",
						type: "replacement_part" as ComponentType,
					},
					{
						name: "Cable",
						partNumber: "CBL-001",
						type: "other" as ComponentType,
					},
				],
			});
			const result = await registerDevice(tx, command);

			expect(result.isSuccess).toBe(true);

			const [device] = await tx
				.select()
				.from(devices)
				.where(eq(devices.serialNumber, command.serialNumber));

			const components = await tx
				.select()
				.from(deviceComponents)
				.where(eq(deviceComponents.deviceId, device?.id as string));

			expect(components.length).toBe(3);
			const types = components.map((c) => c.type).sort();
			expect(types).toEqual(["other", "replacement_part", "supply"]);

			const activities = await getWorkspaceActivities(tx, workspaceId);
			const consumablesActivity = activities.find(
				(activity) => activity.type === "CONSUMABLE_REGISTERED",
			);
			expect(consumablesActivity?.metadata).toEqual({ count: 1 });
		});
	});

	test("Should allow the same serial number in a different workspace", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			const workspaceId1 = await seedWorkspace(tx, { name: "TEST1" });
			const clientId1 = (await seedClient(tx, { workspaceId: workspaceId1 }))
				.id;

			const workspaceId2 = await seedWorkspace(tx, { name: "TEST2" });
			const clientId2 = (await seedClient(tx, { workspaceId: workspaceId2 }))
				.id;

			const serial = `SN-SHARED`;

			const first = await registerDevice(
				tx,
				validCommand(workspaceId1, userId, clientId1, {
					serialNumber: serial,
				}),
			);
			expect(first.isSuccess).toBe(true);

			const second = await registerDevice(
				tx,
				validCommand(workspaceId2, userId, clientId2, {
					serialNumber: serial,
				}),
			);
			expect(second.isSuccess).toBe(true);

			const rows = await tx
				.select()
				.from(devices)
				.where(eq(devices.serialNumber, serial));
			expect(rows.length).toBe(2);

			const inWorkspace2 = rows.filter((r) => r.workspaceId === workspaceId2);
			expect(inWorkspace2.length).toBe(1);

			const activitiesWorkspace1 = await getWorkspaceActivities(
				tx,
				workspaceId1,
			);
			const activitiesWorkspace2 = await getWorkspaceActivities(
				tx,
				workspaceId2,
			);

			expect(activitiesWorkspace1.length).toBe(2);
			expect(activitiesWorkspace2.length).toBe(2);
			expect(
				activitiesWorkspace2.filter(
					(activity) => activity.type === "DEVICE_REGISTERED",
				).length,
			).toBe(1);
		});
	});
});
