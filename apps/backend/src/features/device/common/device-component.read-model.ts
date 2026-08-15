import type { ComponentType } from "./device.model";

export interface DeviceComponentReadModel {
	id: string;
	name: string;
	partNumber: string;
	type: ComponentType;
}
