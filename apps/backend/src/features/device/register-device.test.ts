import { describe, expect, test } from "bun:test";
import {
	clients,
	type DatabaseClient,
	deviceComponents,
	devices,
	workspaces,
} from "@serviceflow/backend/shared/database";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { eq } from "drizzle-orm";
import { ulid } from "ulidx";
import type { ComponentType } from "./common/device.model";
import { deviceDrizzleRepository } from "./common/device-drizzle-repository";
import { registerDeviceCommandHandler } from "./register-device";

const seedWorkspace = async (tx: DatabaseClient, prefix?: string) => {
	const workspaceId = ulid();
	await tx.insert(workspaces).values({
		id: workspaceId,
		name: "Test Workspace",
		prefix: prefix ?? "TEST",
		orderCount: 0,
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

const validCommand = (
	workspaceId: string,
	clientId: string,
	overrides: Record<string, unknown> = {},
) => ({
	workspaceId,
	clientId,
	serialNumber: `SN-${ulid()}`,
	brand: "Samsung",
	model: "Galaxy S21",
	components: [
		{ name: "Batería", partNumber: "BAT-001", type: "supply" as ComponentType },
	],
	...overrides,
});

describe("Register-Device Integration Tests", () => {
	test("Should register a device with a component and persist both", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = await seedClient(tx, workspaceId);
			const command = validCommand(workspaceId, clientId);

			const result = await registerDeviceCommandHandler({
				command,
				repository: deviceDrizzleRepository(tx),
			});

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

	test("Should return DEVICE_ALREADY_EXISTS when serial is already registered in the workspace", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = await seedClient(tx, workspaceId);
			const command = validCommand(workspaceId, clientId);

			await registerDeviceCommandHandler({
				command,
				repository: deviceDrizzleRepository(tx),
			});

			const result = await registerDeviceCommandHandler({
				command: {
					...validCommand(workspaceId, clientId),
					serialNumber: command.serialNumber,
				},
				repository: deviceDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("DEVICE_ALREADY_EXISTS");

			const rows = await tx
				.select()
				.from(devices)
				.where(eq(devices.serialNumber, command.serialNumber));
			expect(rows.length).toBe(1);
		});
	});

	test("Should return DEVICE_BRAND_REQUIRED when brand is empty", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = await seedClient(tx, workspaceId);

			const result = await registerDeviceCommandHandler({
				command: validCommand(workspaceId, clientId, { brand: "" }),
				repository: deviceDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("DEVICE_BRAND_REQUIRED");

			const rows = await tx.select().from(devices);
			expect(rows.length).toBe(0);
		});
	});

	test("Should return DEVICE_COMPONENT_NAME_REQUIRED when component name is empty", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = await seedClient(tx, workspaceId);

			const result = await registerDeviceCommandHandler({
				command: validCommand(workspaceId, clientId, {
					components: [
						{
							name: "",
							partNumber: "BAT-001",
							type: "supply" as ComponentType,
						},
					],
				}),
				repository: deviceDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("DEVICE_COMPONENT_NAME_REQUIRED");

			const rows = await tx.select().from(devices);
			expect(rows.length).toBe(0);
		});
	});

	test("Should register a device without components", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = await seedClient(tx, workspaceId);

			const command = validCommand(workspaceId, clientId, { components: [] });
			const result = await registerDeviceCommandHandler({
				command,
				repository: deviceDrizzleRepository(tx),
			});

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
		});
	});

	test("Should register a device with multiple components of different types", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = await seedClient(tx, workspaceId);

			const command = validCommand(workspaceId, clientId, {
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
			const result = await registerDeviceCommandHandler({
				command,
				repository: deviceDrizzleRepository(tx),
			});

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
		});
	});

	test("Should allow the same serial number in a different workspace", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId1 = await seedWorkspace(tx, "TEST1");
			const clientId1 = await seedClient(tx, workspaceId1);

			const workspaceId2 = await seedWorkspace(tx, "TEST2");
			const clientId2 = await seedClient(tx, workspaceId2);

			const serial = `SN-SHARED`;

			const first = await registerDeviceCommandHandler({
				command: validCommand(workspaceId1, clientId1, {
					serialNumber: serial,
				}),
				repository: deviceDrizzleRepository(tx),
			});
			expect(first.isSuccess).toBe(true);

			const second = await registerDeviceCommandHandler({
				command: validCommand(workspaceId2, clientId2, {
					serialNumber: serial,
				}),
				repository: deviceDrizzleRepository(tx),
			});
			expect(second.isSuccess).toBe(true);

			const rows = await tx
				.select()
				.from(devices)
				.where(eq(devices.serialNumber, serial));
			expect(rows.length).toBe(2);

			const inWorkspace2 = rows.filter((r) => r.workspaceId === workspaceId2);
			expect(inWorkspace2.length).toBe(1);
		});
	});
});
