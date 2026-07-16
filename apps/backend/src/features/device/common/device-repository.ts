import type { Device } from "./device.model";

export interface DeviceRepository {
	save: (model: Device) => Promise<void>;
	getByIds: (deviceId: string, workspaceId: string) => Promise<Device | null>;
	exists: (values: {
		serialNumber: string;
		workspaceId: string;
	}) => Promise<boolean>;
}
