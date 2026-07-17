import {
	type DatabaseClient,
	deviceComponents,
	devices,
} from "@serviceflow/backend/shared/database";
import { and, eq } from "drizzle-orm";
import { Device, DeviceComponent } from "./device.model";
import type { DeviceRepository } from "./device-repository";

export const deviceDrizzleRepository = (
	db: DatabaseClient,
): DeviceRepository => ({
	save: async (model: Device): Promise<void> => {
		await db.insert(devices).values({
			id: model.id,
			clientId: model.clientId,
			workspaceId: model.workspaceId,
			serialNumber: model.serialNumber,
			brand: model.brand,
			model: model.model,
			createdAt: model.createdAt,
			updatedAt: model.updatedAt,
		});

		for (const component of model.components) {
			await db.insert(deviceComponents).values({
				id: component.id,
				deviceId: model.id,
				partNumber: component.partNumber,
				type: component.type,
				name: component.name,
				createdAt: component.createdAt,
				updatedAt: component.updatedAt,
			});
		}
	},

	getByIds: async (
		deviceId: string,
		workspaceId: string,
	): Promise<Device | null> => {
		const [device] = await db
			.select()
			.from(devices)
			.where(
				and(eq(devices.id, deviceId), eq(devices.workspaceId, workspaceId)),
			);

		if (!device) return null;

		const components = await db
			.select()
			.from(deviceComponents)
			.where(eq(deviceComponents.deviceId, deviceId));

		return Device.reconstitute({
			id: device.id,
			workspaceId: device.workspaceId,
			clientId: device.clientId,
			serialNumber: device.serialNumber,
			brand: device.brand,
			model: device.model,
			components: components.map((component) =>
				DeviceComponent.reconstitute({
					id: component.id,
					name: component.name,
					partNumber: component.partNumber,
					type: component.type,
					createdAt: component.createdAt,
					updatedAt: component.updatedAt,
				}),
			),
			createdAt: device.createdAt,
			updatedAt: device.updatedAt,
		});
	},

	exists: async (values: {
		serialNumber: string;
		workspaceId: string;
	}): Promise<boolean> => {
		const device = await db.query.devices.findFirst({
			where: (devices, { eq, and }) =>
				and(
					eq(devices.serialNumber, values.serialNumber),
					eq(devices.workspaceId, values.workspaceId),
				),
			columns: { id: true },
		});

		return !!device;
	},
});
