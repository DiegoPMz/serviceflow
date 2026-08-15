import type { OrderStatus } from "./order.model";

export interface OrderSummaryReadModelData {
	id: string;
	folio: string;
	status: OrderStatus;
	clientNameSnapshot: string;
	clientPhoneSnapshot: string;
	deviceBrandSnapshot: string;
	deviceModelSnapshot: string;
	userNameSnapshot: string;
	userPictureUrl: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export class OrderSummaryReadModel {
	private constructor(
		public readonly id: string,
		public readonly folio: string,
		public readonly status: OrderStatus,
		public readonly clientName: string,
		public readonly deviceFullName: string,
		public readonly createdByName: string,
		public readonly userPictureUrl: string | null,
		public readonly createdAt: string,
		public readonly updatedAt: string,
	) {}

	public static create(data: OrderSummaryReadModelData): OrderSummaryReadModel {
		return new OrderSummaryReadModel(
			data.id,
			data.folio,
			data.status,
			data.clientNameSnapshot,
			`${data.deviceBrandSnapshot} ${data.deviceModelSnapshot}`.trim(),
			data.userNameSnapshot,
			data.userPictureUrl,
			data.createdAt.toISOString(),
			data.updatedAt.toISOString(),
		);
	}
}
