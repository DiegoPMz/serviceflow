import {
	type DatabaseClient,
	orderComponents,
	orders,
} from "@serviceflow/backend/shared/database";
import type { Order } from "./order.model";
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

			documentUrl: null,
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
		});

		for (const item of model.orderComponents) {
			await db.insert(orderComponents).values({
				id: item.id,
				orderId: item.orderId,
				deviceComponentId: item.deviceComponentId,
				quantity: item.quantity,
				componentNameSnapshot: item.componentNameSnapshot,
				partNumberSnapshot: item.partNumberSnapshot,
				createdAt: item.createdAt,
			});
		}
	},
});
