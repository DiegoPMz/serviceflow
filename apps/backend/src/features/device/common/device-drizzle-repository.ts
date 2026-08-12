import {
	type DatabaseClient,
	type DatabaseType,
	deviceComponents,
	devices,
} from "@serviceflow/backend/shared/database";
import {
	Cursor,
	type Pagination,
	type SortDirection,
} from "@serviceflow/backend/shared/pagination";
import { and, asc, desc, eq, gt, like, lt, or, type SQL } from "drizzle-orm";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";
import type { DeviceCursor, DeviceOrderBy } from "../paginated-devices";
import { Device, DeviceComponent } from "./device.model";
import type { DeviceReadModel } from "./device.read-model";
import type { DeviceRepository } from "./device-repository";

export const deviceDrizzleRepository = (
	db: DatabaseClient | DatabaseType,
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

	getAllPaginated: async ({
		limit,
		cursor,
		orderBy,
		direction,
		search,
		workspaceId,
		clientId,
	}: {
		limit: number;
		cursor?: DeviceCursor;
		orderBy: DeviceOrderBy;
		direction: SortDirection;
		search?: string;
		workspaceId: string;
		clientId?: string;
	}): Promise<Pagination<DeviceReadModel>> => {
		const orderByMapper: Record<DeviceOrderBy, SQLiteColumn> = {
			id: devices.id,
			clientId: devices.clientId,
			brand: devices.brand,
			model: devices.model,
			serialNumber: devices.serialNumber,
		};

		const valueMapper: Record<
			DeviceOrderBy,
			(device: DeviceReadModel) => string
		> = {
			id: (device) => device.id,
			clientId: (device) => device.clientId,
			brand: (device) => device.brand,
			model: (device) => device.model,
			serialNumber: (device) => device.serialNumber,
		};

		const dbField = orderByMapper[orderBy];

		const searchCondition = search
			? or(
					like(devices.brand, `%${search}%`),
					like(devices.model, `%${search}%`),
					like(devices.serialNumber, `%${search}%`),
				)
			: undefined;

		const clientCondition = clientId
			? eq(devices.clientId, clientId)
			: undefined;

		const sortCondition = buildSortConditions();

		const devicesDb = await db
			.select({
				id: devices.id,
				clientId: devices.clientId,
				serialNumber: devices.serialNumber,
				brand: devices.brand,
				model: devices.model,
			})
			.from(devices)
			.where(
				and(
					eq(devices.workspaceId, workspaceId),
					clientCondition,
					searchCondition,
					sortCondition,
				),
			)
			.orderBy(...buildOrderBy())
			.limit(limit + 1);

		const hasNextPage = devicesDb.length > limit;
		const items = devicesDb.slice(0, limit);
		const lastItem = items.at(-1);

		let nextCursor: string | null = null;

		if (hasNextPage && lastItem) {
			nextCursor = Cursor.encode<DeviceCursor>({
				id: lastItem.id,
				orderBy,
				direction,
				value: valueMapper[orderBy](lastItem),
			});
		}

		return {
			items,
			cursor: nextCursor,
			hasNextPage,
		};

		function buildOrderBy(): SQL[] {
			return direction === "desc"
				? [desc(dbField), desc(devices.id)]
				: [asc(dbField), asc(devices.id)];
		}

		function buildSortConditions(): SQL | undefined {
			if (!cursor) return undefined;

			const value = cursor.value;

			if (direction === "desc") {
				return or(
					lt(dbField, value),
					and(eq(dbField, value), lt(devices.id, cursor.id)),
				);
			}

			return or(
				gt(dbField, value),
				and(eq(dbField, value), gt(devices.id, cursor.id)),
			);
		}
	},

	transaction: async <R>(
		fn: (txRepo: DeviceRepository) => Promise<R>,
	): Promise<R> => {
		return await db.transaction(async (tx) => {
			const txRepo = deviceDrizzleRepository(tx);
			return await fn(txRepo);
		});
	},
});
