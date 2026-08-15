import type { Transactional } from "@serviceflow/backend/shared/database";
import type { Pagination } from "@serviceflow/backend/shared/pagination";
import type { SortDirection } from "@serviceflow/backend/shared/pagination/types";
import type {
	DeviceComponentCursor,
	DeviceComponentOrderBy,
} from "../get-paginated-device-components";
import type { DeviceCursor, DeviceOrderBy } from "../paginated-devices";
import type { Device } from "./device.model";
import type { DeviceReadModel } from "./device.read-model";
import type { DeviceComponentReadModel } from "./device-component.read-model";

export interface DeviceRepository extends Transactional<DeviceRepository> {
	save: (model: Device) => Promise<void>;
	getByIds: (deviceId: string, workspaceId: string) => Promise<Device | null>;
	exists: (values: {
		serialNumber: string;
		workspaceId: string;
	}) => Promise<boolean>;
	getAllPaginated(params: {
		limit: number;
		cursor?: DeviceCursor;
		orderBy: DeviceOrderBy;
		direction: SortDirection;
		search?: string;
		workspaceId: string;
		clientId?: string;
	}): Promise<Pagination<DeviceReadModel>>;
	getDeviceComponentsPaginated(params: {
		limit: number;
		cursor?: DeviceComponentCursor;
		orderBy: DeviceComponentOrderBy;
		direction: SortDirection;
		search?: string;
		deviceId: string;
		workspaceId: string;
	}): Promise<Pagination<DeviceComponentReadModel>>;
}
