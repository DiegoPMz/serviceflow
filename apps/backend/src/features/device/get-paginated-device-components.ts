import {
	Cursor,
	type PaginationCursor,
} from "@serviceflow/backend/shared/pagination";
import type {
	Pagination,
	SortDirection,
} from "@serviceflow/backend/shared/pagination/types";
import { Result } from "@serviceflow/backend/shared/result";
import { DeviceErrors } from "./common/device.errors";
import type { DeviceComponentReadModel } from "./common/device-component.read-model";
import type { DeviceRepository } from "./common/device-repository";

export type DeviceComponentOrderBy =
	| "id"
	| "name"
	| "partNumber"
	| "type"
	| "createdAt";

interface PaginationDeviceComponentsRequest {
	limit: number;
	cursor?: string;
	orderBy: DeviceComponentOrderBy;
	direction: SortDirection;
	search?: string;
}

export type DeviceComponentCursor = PaginationCursor<
	DeviceComponentOrderBy,
	string | number
>;

type PaginatedDeviceComponentsQuery = {
	paginationRequest: PaginationDeviceComponentsRequest;
	workspaceId: string;
	deviceId: string;
};

interface PaginatedDeviceComponentsProps {
	query: PaginatedDeviceComponentsQuery;
	repository: DeviceRepository;
}

export const paginatedDeviceComponentsHandler = async ({
	query,
	repository,
}: PaginatedDeviceComponentsProps): Promise<
	Result<Pagination<DeviceComponentReadModel>>
> => {
	const { paginationRequest: pagination, deviceId } = query;

	const device = await repository.getByIds(deviceId, query.workspaceId);

	if (!device) {
		return Result.failure(DeviceErrors.DEVICE_NOT_FOUND);
	}

	const cursor = Cursor.validate<DeviceComponentCursor>(pagination);

	if (cursor.isFailure) {
		return Result.failure(cursor.error);
	}

	const components = await repository.getDeviceComponentsPaginated({
		limit: pagination.limit,
		search: pagination.search,
		orderBy: pagination.orderBy,
		direction: pagination.direction,
		cursor: cursor.value ?? undefined,
		deviceId,
		workspaceId: query.workspaceId,
	});

	return Result.success(components);
};
