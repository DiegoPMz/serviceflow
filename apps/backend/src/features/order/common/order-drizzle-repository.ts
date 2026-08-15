import {
	type DatabaseClient,
	type DatabaseType,
	orderComponents,
	orders,
	users,
} from "@serviceflow/backend/shared/database";
import {
	Cursor,
	type Pagination,
	type SortDirection,
} from "@serviceflow/backend/shared/pagination";
import { and, asc, desc, eq, gt, like, lt, or, type SQL } from "drizzle-orm";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";
import type { ComponentType } from "../../device/common/device.model";
import type { OrderCursor, OrderOrderBy } from "../paginated-orders";
import { Order, type OrderStatus } from "./order.model";
import type { OrderRepository } from "./order-repository";
import {
	OrderSummaryReadModel,
	type OrderSummaryReadModelData,
} from "./order-summary.read-model";

export const OrderDrizzleRepository = (
	db: DatabaseClient | DatabaseType,
): OrderRepository => ({
	save: async (model: Order): Promise<void> => {
		await db.insert(orders).values({
			id: model.id,
			userId: model.userId,
			clientId: model.clientId,
			workspaceId: model.workspaceId,
			deviceId: model.deviceId,
			folio: model.folio,

			documentKey: null,
			observations: model.observations,
			createdAt: model.createdAt,
			updatedAt: model.updatedAt,

			deviceBrandSnapshot: model.deviceBrandSnapshot,
			deviceModelSnapshot: model.deviceModelSnapshot,
			deviceSerialNumberSnapshot: model.deviceSerialNumberSnapshot,

			clientNameSnapshot: model.clientNameSnapshot,
			clientPhoneSnapshot: model.clientPhoneSnapshot,
			clientEmailSnapshot: model.clientEmailSnapshot,
			clientLocationSnapshot: model.clientLocationSnapshot,
			userNameSnapshot: model.userNameSnapshot,
			status: model.status,
		});

		for (const item of model.orderComponents) {
			await db.insert(orderComponents).values({
				id: item.id,
				orderId: item.orderId,
				deviceComponentId: item.deviceComponentId,
				quantity: item.quantity,
				componentNameSnapshot: item.componentNameSnapshot,
				partNumberSnapshot: item.partNumberSnapshot,
				typeSnapshot: item.type,
				createdAt: item.createdAt,
			});
		}
	},
	getById: async (id: string): Promise<Order | null> => {
		const entity = await db.query.orders.findFirst({
			where: eq(orders.id, id),
			with: {
				orderComponents: true,
			},
		});

		if (!entity) return null;

		return Order.reconstitute({
			id: entity.id,
			clientId: entity.clientId,
			deviceId: entity.deviceId,
			userId: entity.userId,
			workspaceId: entity.workspaceId,
			observations: entity.observations,
			folio: entity.folio,

			clientNameSnapshot: entity.clientNameSnapshot,
			clientEmailSnapshot: entity.clientEmailSnapshot,
			clientPhoneSnapshot: entity.clientPhoneSnapshot,
			clientLocationSnapshot: entity.clientLocationSnapshot,

			deviceBrandSnapshot: entity.deviceBrandSnapshot,
			deviceModelSnapshot: entity.deviceModelSnapshot,
			deviceSerialNumberSnapshot: entity.deviceSerialNumberSnapshot,

			orderComponents: entity.orderComponents.map((comp) => ({
				id: comp.id,
				componentNameSnapshot: comp.componentNameSnapshot,
				deviceComponentId: comp.deviceComponentId,
				orderId: comp.orderId,
				type: comp.typeSnapshot as ComponentType,
				partNumberSnapshot: comp.partNumberSnapshot,
				quantity: comp.quantity,
				createdAt: comp.createdAt,
			})),

			createdAt: new Date(entity.createdAt),
			updatedAt: new Date(entity.updatedAt),
			documentKey: entity.documentKey,
			userNameSnapshot: entity.userNameSnapshot,
			status: entity.status as OrderStatus,
		});
	},

	update: async (model: Order): Promise<void> => {
		await db
			.update(orders)
			.set({
				updatedAt: model.updatedAt,
				documentKey: model.documentKey,
			})
			.where(eq(orders.id, model.id));
	},

	updateStatus: async (model: Order): Promise<void> => {
		await db
			.update(orders)
			.set({
				status: model.status,
				updatedAt: model.updatedAt,
			})
			.where(eq(orders.id, model.id));
	},

	getAllPaginated: async ({
		limit,
		cursor,
		orderBy,
		direction,
		search,
		workspaceId,
		status,
	}: {
		limit: number;
		cursor?: OrderCursor;
		orderBy: OrderOrderBy;
		direction: SortDirection;
		search?: string;
		workspaceId: string;
		status?: OrderStatus;
	}): Promise<Pagination<OrderSummaryReadModel>> => {
		const orderByMapper: Record<OrderOrderBy, SQLiteColumn> = {
			id: orders.id,
			folio: orders.folio,
			createdAt: orders.createdAt,
			updatedAt: orders.updatedAt,
			clientName: orders.clientNameSnapshot,
			deviceBrand: orders.deviceBrandSnapshot,
			status: orders.status,
			userName: orders.userNameSnapshot,
		};

		const valueMapper: Record<
			OrderOrderBy,
			(order: OrderSummaryReadModelData) => string | number
		> = {
			id: (order) => order.id,
			folio: (order) => order.folio,
			createdAt: (order) => order.createdAt.getTime(),
			updatedAt: (order) => order.updatedAt.getTime(),
			clientName: (order) => order.clientNameSnapshot,
			deviceBrand: (order) => order.deviceBrandSnapshot,
			status: (order) => order.status,
			userName: (order) => order.userNameSnapshot,
		};

		const dbField = orderByMapper[orderBy];

		const searchCondition = search
			? or(
					like(orders.folio, `%${search}%`),
					like(orders.clientNameSnapshot, `%${search}%`),
					like(orders.deviceBrandSnapshot, `%${search}%`),
					like(orders.deviceModelSnapshot, `%${search}%`),
					like(orders.clientPhoneSnapshot, `%${search}%`),
				)
			: undefined;

		const statusCondition = status ? eq(orders.status, status) : undefined;

		const sortCondition = buildSortConditions();

		const ordersDb: OrderSummaryReadModelData[] = await db
			.select({
				id: orders.id,
				folio: orders.folio,
				status: orders.status,
				clientNameSnapshot: orders.clientNameSnapshot,
				clientPhoneSnapshot: orders.clientPhoneSnapshot,
				deviceBrandSnapshot: orders.deviceBrandSnapshot,
				deviceModelSnapshot: orders.deviceModelSnapshot,
				userNameSnapshot: orders.userNameSnapshot,
				userPictureUrl: users.pictureUrl,
				createdAt: orders.createdAt,
				updatedAt: orders.updatedAt,
			})
			.from(orders)
			.innerJoin(users, eq(orders.userId, users.id))
			.where(
				and(
					eq(orders.workspaceId, workspaceId),
					statusCondition,
					searchCondition,
					sortCondition,
				),
			)
			.orderBy(...buildOrderBy())
			.limit(limit + 1);

		const hasNextPage = ordersDb.length > limit;
		const items = ordersDb.slice(0, limit);
		const lastItem = items.at(-1);

		let nextCursor: string | null = null;

		if (hasNextPage && lastItem) {
			nextCursor = Cursor.encode<OrderCursor>({
				id: lastItem.id,
				orderBy,
				direction,
				value: valueMapper[orderBy](lastItem),
			});
		}

		return {
			items: items.map((i) => OrderSummaryReadModel.create(i)),
			cursor: nextCursor,
			hasNextPage,
		};

		function buildOrderBy(): SQL[] {
			return direction === "desc"
				? [desc(dbField), desc(orders.id)]
				: [asc(dbField), asc(orders.id)];
		}

		function buildSortConditions(): SQL | undefined {
			if (!cursor) return undefined;

			const value = DATE_FIELDS.has(orderBy)
				? new Date(cursor.value as number)
				: cursor.value;

			if (direction === "desc") {
				return or(
					lt(dbField, value),
					and(eq(dbField, value), lt(orders.id, cursor.id)),
				);
			}

			return or(
				gt(dbField, value),
				and(eq(dbField, value), gt(orders.id, cursor.id)),
			);
		}
	},
});

const DATE_FIELDS: ReadonlySet<OrderOrderBy> = new Set([
	"createdAt",
	"updatedAt",
]);
