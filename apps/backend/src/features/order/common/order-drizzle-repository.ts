import {
	type DatabaseClient,
	orderComponents,
	orders,
} from "@serviceflow/backend/shared/database";
import { eq } from "drizzle-orm";
import type { ComponentType } from "../../device/common/device.model";
import { Order } from "./order.model";
import type { OrderRepository } from "./order-repository";

export const OrderDrizzleRepository = (
	db: DatabaseClient,
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
});
