import { Result, Updated } from "@serviceflow/backend/shared/result";
import { ulid } from "ulidx";
import type { ComponentType } from "../../device/common/device.model";
import { OrderErrors } from "./order.errors";

export const ORDER_STATUSES_ARRAY = [
	"pendiente",
	"entregada",
	"cancelada",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES_ARRAY)[number];

type CreateOrderData = Omit<
	Order,
	| "id"
	| "createdAt"
	| "updatedAt"
	| "documentKey"
	| "attachDocumentKey"
	| "folio"
	| "_orderComponents"
	| "_status"
	| "orderComponents"
	| "status"
	| "addComponent"
	| "deliver"
	| "cancel"
> & { folio: Folio };

interface AddOrderComponent {
	deviceComponentId: string;
	name: string;
	quantity: number;
	partNumber: string;
	type: ComponentType;
}

export class Order {
	private constructor(
		public readonly id: string,
		public readonly clientId: string,
		public readonly deviceId: string,
		public readonly userId: string,
		public readonly workspaceId: string,

		public readonly observations: string,
		public readonly folio: string,

		public readonly clientNameSnapshot: string,
		public readonly clientEmailSnapshot: string,
		public readonly clientPhoneSnapshot: string,
		public readonly clientLocationSnapshot: string,
		public readonly deviceBrandSnapshot: string,
		public readonly deviceModelSnapshot: string,
		public readonly deviceSerialNumberSnapshot: string,

		private _orderComponents: OrderComponent[],

		public readonly createdAt: Date,
		public updatedAt: Date,
		public documentKey: string | null,
		public readonly userNameSnapshot: string,
		private _status: OrderStatus,
	) {}

	public attachDocumentKey(key: string): Result<Updated> {
		this.documentKey = key;
		return Updated.toResult();
	}

	get status(): OrderStatus {
		return this._status;
	}

	deliver(): Result<Updated> {
		if (this._status === "entregada") {
			return Result.failure(OrderErrors.ORDER_ALREADY_DELIVERED);
		}

		if (this._status === "cancelada") {
			return Result.failure(OrderErrors.ORDER_CANNOT_DELIVER_CANCELED);
		}

		this._status = "entregada";
		this.updatedAt = new Date();
		return Updated.toResult();
	}

	cancel(): Result<Updated> {
		if (this._status === "cancelada") {
			return Result.failure(OrderErrors.ORDER_ALREADY_CANCELED);
		}

		if (this._status === "entregada") {
			return Result.failure(OrderErrors.ORDER_CANNOT_CANCEL_DELIVERED);
		}

		this._status = "cancelada";
		this.updatedAt = new Date();
		return Updated.toResult();
	}

	get orderComponents(): readonly OrderComponent[] {
		return structuredClone(this._orderComponents);
	}

	addComponent(data: AddOrderComponent): Result<Updated> {
		const addComponentResult = OrderComponent.create({
			deviceComponentId: data.deviceComponentId,
			name: data.name,
			quantity: data.quantity,
			partNumber: data.partNumber,
			type: data.type,
			orderId: this.id,
		});

		if (addComponentResult.isFailure) {
			return Result.failure(addComponentResult.error);
		}

		this._orderComponents.push(addComponentResult.value);
		return Updated.toResult();
	}

	static create(data: CreateOrderData): Result<Order> {
		if (!data.clientId || data.clientId.trim().length < 1) {
			return Result.failure(OrderErrors.ORDER_CLIENT_ID_REQUIRED);
		}

		if (!data.observations || data.observations.trim().length < 1) {
			return Result.failure(OrderErrors.ORDER_ISSUE_OBSERVATION_REQUIRED);
		}

		if (data.observations.trim().length > 1000) {
			return Result.failure(OrderErrors.ORDER_ISSUE_OBSERVATION_TOO_LONG);
		}

		if (!data.workspaceId || data.workspaceId.trim().length < 1) {
			return Result.failure(OrderErrors.ORDER_WORKSPACE_ID_REQUIRED);
		}

		if (!data.userId || data.userId.trim().length < 1) {
			return Result.failure(OrderErrors.ORDER_USER_ID_REQUIRED);
		}

		if (!(data.folio instanceof Folio) || data.folio.value.trim().length < 1) {
			return Result.failure(OrderErrors.ORDER_FOLIO_INVALID);
		}

		if (!data.userNameSnapshot || data.userNameSnapshot.trim().length < 1) {
			return Result.failure(OrderErrors.ORDER_USER_NAME_SNAPSHOT_REQUIRED);
		}

		const now = new Date();
		return Result.success(
			new Order(
				ulid(),
				data.clientId,
				data.deviceId,
				data.userId,
				data.workspaceId,
				data.observations,
				data.folio.value,
				data.clientNameSnapshot,
				data.clientEmailSnapshot,
				data.clientPhoneSnapshot,
				data.clientLocationSnapshot,
				data.deviceBrandSnapshot,
				data.deviceModelSnapshot,
				data.deviceSerialNumberSnapshot,
				[],
				now,
				now,
				null,
				data.userNameSnapshot,
				"pendiente",
			),
		);
	}

	static reconstitute(entity: OrderReconstitute): Order {
		return new Order(
			entity.id,
			entity.clientId,
			entity.deviceId,
			entity.userId,
			entity.workspaceId,
			entity.observations,
			entity.folio,
			entity.clientNameSnapshot,
			entity.clientEmailSnapshot,
			entity.clientPhoneSnapshot,
			entity.clientLocationSnapshot,
			entity.deviceBrandSnapshot,
			entity.deviceModelSnapshot,
			entity.deviceSerialNumberSnapshot,
			entity.orderComponents,
			entity.createdAt,
			entity.updatedAt,
			entity.documentKey,
			entity.userNameSnapshot,
			entity.status,
		);
	}
}

interface OrderReconstitute {
	id: string;
	clientId: string;
	deviceId: string;
	userId: string;
	workspaceId: string;
	observations: string;
	folio: string;
	clientNameSnapshot: string;
	clientEmailSnapshot: string;
	clientPhoneSnapshot: string;
	clientLocationSnapshot: string;
	deviceBrandSnapshot: string;
	deviceModelSnapshot: string;
	deviceSerialNumberSnapshot: string;
	orderComponents: OrderComponent[];
	createdAt: Date;
	updatedAt: Date;
	documentKey: string | null;
	userNameSnapshot: string;
	status: OrderStatus;
}

export class Folio {
	private constructor(public readonly value: string) {}

	static create(data: {
		workspaceOrderCount: number;
		workspacePrefix: string;
	}): Result<Folio> {
		if (Number.isNaN(data.workspaceOrderCount)) {
			return Result.failure(OrderErrors.FOLIO_WORKSPACE_ORDER_COUNT_NAN);
		}

		if (data.workspaceOrderCount < 0) {
			return Result.failure(OrderErrors.FOLIO_WORKSPACE_ORDER_COUNT_NEGATIVE);
		}

		if (data.workspacePrefix.trim().length < 1) {
			return Result.failure(OrderErrors.FOLIO_WORKSPACE_PREFIX_REQUIRED);
		}

		return Result.success(
			new this(data.workspacePrefix + (data.workspaceOrderCount + 1)),
		);
	}
}

interface CreateOrderComponent {
	deviceComponentId: string;
	name: string;
	quantity: number;
	partNumber: string;
	type: ComponentType;
	orderId: string;
}

class OrderComponent {
	private constructor(
		public readonly id: string,
		public readonly orderId: string,
		public readonly deviceComponentId: string,
		public readonly quantity: number,
		public readonly componentNameSnapshot: string,
		public readonly partNumberSnapshot: string,
		public readonly type: ComponentType,
		public readonly createdAt: Date,
	) {}

	static create(data: CreateOrderComponent): Result<OrderComponent> {
		if (!data.deviceComponentId.trim()) {
			return Result.failure(
				OrderErrors.ORDER_COMPONENT_DEVICE_COMPONENT_ID_REQUIRED,
			);
		}

		if (!data.name.trim()) {
			return Result.failure(OrderErrors.ORDER_COMPONENT_NAME_REQUIRED);
		}

		if (!Number.isInteger(data.quantity) || data.quantity <= 0) {
			return Result.failure(OrderErrors.ORDER_COMPONENT_QUANTITY_INVALID);
		}

		return Result.success(
			new OrderComponent(
				ulid(),
				data.orderId,
				data.deviceComponentId,
				data.quantity,
				data.name,
				data.partNumber,
				data.type,
				new Date(),
			),
		);
	}
}

export type OrderComponentType = OrderComponent;
