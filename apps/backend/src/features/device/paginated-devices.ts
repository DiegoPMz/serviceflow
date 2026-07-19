import {
	Cursor,
	type PaginationCursor,
} from "@serviceflow/backend/shared/pagination";
import type {
	Pagination,
	SortDirection,
} from "@serviceflow/backend/shared/pagination/types";
import { Result } from "@serviceflow/backend/shared/result";
import type { DeviceReadModel } from "./common/device.read-model";
import type { DeviceRepository } from "./common/device-repository";

export type DeviceOrderBy =
	| "id"
	| "brand"
	| "model"
	| "serialNumber"
	| "clientId";

interface PaginationDeviceRequest {
	limit: number;
	cursor?: string;
	orderBy: DeviceOrderBy;
	direction: SortDirection;
	search?: string;
}

export type DeviceCursor = PaginationCursor<DeviceOrderBy, string>;

type PaginatedDevicesQuery = {
	paginationRequest: PaginationDeviceRequest;
	workspaceId: string;
	clientId?: string;
};

interface PaginatedDeviceProps {
	query: PaginatedDevicesQuery;
	repository: DeviceRepository;
}
export const paginatedDeviceQueryHandler = async ({
	query,
	repository,
}: PaginatedDeviceProps): Promise<Result<Pagination<DeviceReadModel>>> => {
	const { paginationRequest: pagination, clientId } = query;

	const cursor = Cursor.validate<DeviceCursor>(pagination);

	if (cursor.isFailure) {
		return Result.failure(cursor.error);
	}

	const devices = await repository.getAllPaginated({
		limit: pagination.limit,
		search: pagination.search,
		orderBy: pagination.orderBy,
		direction: pagination.direction,
		cursor: cursor.value ?? undefined,
		workspaceId: query.workspaceId,
		clientId,
	});

	return Result.success(devices);
};
