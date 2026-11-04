import type { ComponentType } from "../../device/common/device.model";
import type { Order, OrderServiceType, OrderStatus } from "./order.model";

export interface OrderDetailsReadModelData {
	order: Order;
	technicianPictureUrl: string | null;
}

export class OrderDetailsReadModel {
	private constructor(
		public readonly id: string,
		public readonly folio: string,
		public readonly status: OrderStatus,
		public readonly serviceType: OrderServiceType,
		public readonly observations: string,
		public readonly createdAt: string, // ISO 8601
		public readonly updatedAt: string, // ISO 8601
		public readonly hasDocument: boolean,

		public readonly technician: {
			name: string;
			pictureUrl: string | null;
		},

		public readonly client: {
			name: string;
			phone: string;
			email: string;
			location: string;
		},

		public readonly device: {
			brand: string;
			model: string;
			serialNumber: string;
			fullName: string;
		},

		public readonly supplies: {
			id: string;
			name: string;
			quantity: number;
			type: ComponentType;
			partNumber: string;
		}[],
	) {}

	public static create({
		order,
		technicianPictureUrl,
	}: OrderDetailsReadModelData): OrderDetailsReadModel {
		return new OrderDetailsReadModel(
			order.id,
			order.folio,
			order.status,
			order.serviceType,
			order.observations,
			order.createdAt.toISOString(),
			order.updatedAt.toISOString(),
			order.documentKey !== null,

			{
				name: order.userNameSnapshot,
				pictureUrl: technicianPictureUrl,
			},

			{
				name: order.clientNameSnapshot,
				phone: order.clientPhoneSnapshot,
				email: order.clientEmailSnapshot,
				location: order.clientLocationSnapshot,
			},

			{
				brand: order.deviceBrandSnapshot,
				model: order.deviceModelSnapshot,
				serialNumber: order.deviceSerialNumberSnapshot,
				fullName:
					`${order.deviceBrandSnapshot} ${order.deviceModelSnapshot}`.trim(),
			},

			order.orderComponents.map((c) => ({
				id: c.id,
				name: c.componentNameSnapshot,
				partNumber: c.partNumberSnapshot,
				quantity: c.quantity,
				type: c.type,
			})),
		);
	}
}
