import {
	type DatabaseClient,
	deviceComponents,
	devices,
} from "@serviceflow/backend/shared/database";
import type { Device } from "./device.model";
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

	getByIds: (
		_deviceId: string,
		_workspaceId: string,
	): Promise<Device | null> => {
		throw new Error("Function not implemented.");
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
