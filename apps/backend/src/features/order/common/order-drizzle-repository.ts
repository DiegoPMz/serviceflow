import {
	type DatabaseClient,
	type DatabaseType,
	orderComponents,
	orders,
	users,
} from "@serviceflow/backend/shared/database";
import { and, asc, desc, eq, like, or } from "drizzle-orm";
import type { ComponentType } from "../../device/common/device.model";
import { Order, type OrderStatus } from "./order.model";
import type {
	OffsetPagination,
	OrderPaginationParams,
	OrderRepository,
} from "./order-repository";
import { OrderSummaryReadModel } from "./order-summary.read-model";

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

	offsetPagination: async (
		params: OrderPaginationParams,
	): Promise<OffsetPagination<OrderSummaryReadModel>> => {
		const searchCondition = params.search
			? or(
					like(orders.folio, `%${params.search}%`),
					like(orders.clientNameSnapshot, `%${params.search}%`),
					like(orders.deviceBrandSnapshot, `%${params.search}%`),
					like(orders.deviceModelSnapshot, `%${params.search}%`),
					like(orders.clientPhoneSnapshot, `%${params.search}%`),
				)
			: undefined;

		const statusCondition = params.status
			? eq(orders.status, params.status)
			: undefined;

		const baseConditions = and(
			eq(orders.workspaceId, params.workspaceId),
			searchCondition,
			statusCondition,
		);

		const orderBy =
			params.direction === "asc"
				? [asc(orders.updatedAt), asc(orders.id)]
				: [desc(orders.updatedAt), desc(orders.id)];

		const count = await db.$count(orders, baseConditions);
		const offset = (params.page - 1) * params.pageSize;

		const ordersDb = await db
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
			.where(baseConditions)
			.orderBy(...orderBy)
			.limit(params.pageSize)
			.offset(offset);

		const totalItems = Number(count);
		const totalPages = Math.ceil(totalItems / params.pageSize);

		return {
			items: ordersDb.map((i) => OrderSummaryReadModel.create(i)),
			page: params.page,
			pageSize: params.pageSize,
			totalItems,
			totalPages,
		};
	},
});
