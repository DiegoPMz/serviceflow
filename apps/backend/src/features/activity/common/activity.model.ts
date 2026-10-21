import { Result } from "@serviceflow/backend/shared/result";
import { ulid } from "ulidx";
import type { OrderStatus } from "../../order/common/order.model";
import { ActivityErrors } from "./activity.errors";

export const ACTIVITY_TYPES_ARRAY = [
	"ORDER_CREATED",
	"ORDER_STATUS_CHANGED",
	"CLIENT_CREATED",
	"DEVICE_REGISTERED",
	"CONSUMABLE_REGISTERED",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES_ARRAY)[number];

export interface ActivityActor {
	userId: string;
	name: string;
}

export type ActivityMetadata =
	| { previousStatus: OrderStatus; newStatus: OrderStatus }
	| { count: number };

interface CreateActivity {
	workspaceId: string;
	actor: ActivityActor;
	type: ActivityType;
	entityId: string | null;
	entityLabel: string;
	metadata: ActivityMetadata | null;
}

interface OrderActivityData {
	workspaceId: string;
	actor: ActivityActor;
	orderId: string;
	folio: string;
}

interface ClientActivityData {
	workspaceId: string;
	actor: ActivityActor;
	clientId: string;
	clientName: string;
}

interface DeviceActivityData {
	workspaceId: string;
	actor: ActivityActor;
	deviceId: string;
	deviceFullName: string;
}

const MAX_ACTOR_NAME_LENGTH = 200;
const MAX_ENTITY_LABEL_LENGTH = 255;

export class WorkspaceActivity {
	private constructor(
		public readonly id: string,
		public readonly workspaceId: string,
		public readonly actorUserId: string,
		public readonly actorNameSnapshot: string,
		public readonly type: ActivityType,
		public readonly entityId: string | null,
		public readonly entityLabel: string,
		public readonly metadata: ActivityMetadata | null,
		public readonly createdAt: Date,
	) {}

	static orderCreated(data: OrderActivityData): Result<WorkspaceActivity> {
		return WorkspaceActivity.create({
			workspaceId: data.workspaceId,
			actor: data.actor,
			type: "ORDER_CREATED",
			entityId: data.orderId || null,
			entityLabel: data.folio,
			metadata: null,
		});
	}

	static orderStatusChanged(
		data: OrderActivityData & {
			previousStatus: OrderStatus;
			newStatus: OrderStatus;
		},
	): Result<WorkspaceActivity> {
		if (data.previousStatus === data.newStatus) {
			return Result.failure(ActivityErrors.ACTIVITY_STATUS_UNCHANGED);
		}

		return WorkspaceActivity.create({
			workspaceId: data.workspaceId,
			actor: data.actor,
			type: "ORDER_STATUS_CHANGED",
			entityId: data.orderId || null,
			entityLabel: data.folio,
			metadata: {
				previousStatus: data.previousStatus,
				newStatus: data.newStatus,
			},
		});
	}

	static clientCreated(data: ClientActivityData): Result<WorkspaceActivity> {
		return WorkspaceActivity.create({
			workspaceId: data.workspaceId,
			actor: data.actor,
			type: "CLIENT_CREATED",
			entityId: data.clientId || null,
			entityLabel: data.clientName,
			metadata: null,
		});
	}

	static deviceRegistered(data: DeviceActivityData): Result<WorkspaceActivity> {
		return WorkspaceActivity.create({
			workspaceId: data.workspaceId,
			actor: data.actor,
			type: "DEVICE_REGISTERED",
			entityId: data.deviceId || null,
			entityLabel: data.deviceFullName,
			metadata: null,
		});
	}

	static consumablesRegistered(
		data: DeviceActivityData & { count: number },
	): Result<WorkspaceActivity> {
		if (!Number.isInteger(data.count) || data.count <= 0) {
			return Result.failure(ActivityErrors.ACTIVITY_CONSUMABLE_COUNT_INVALID);
		}

		return WorkspaceActivity.create({
			workspaceId: data.workspaceId,
			actor: data.actor,
			type: "CONSUMABLE_REGISTERED",
			entityId: data.deviceId || null,
			entityLabel: data.deviceFullName,
			metadata: { count: data.count },
		});
	}

	private static create(data: CreateActivity): Result<WorkspaceActivity> {
		if (!data.workspaceId || data.workspaceId.trim().length < 1) {
			return Result.failure(ActivityErrors.ACTIVITY_WORKSPACE_ID_REQUIRED);
		}

		if (!data.actor.userId || data.actor.userId.trim().length < 1) {
			return Result.failure(ActivityErrors.ACTIVITY_ACTOR_ID_REQUIRED);
		}

		if (!data.actor.name || data.actor.name.trim().length < 1) {
			return Result.failure(ActivityErrors.ACTIVITY_ACTOR_NAME_REQUIRED);
		}

		if (data.actor.name.trim().length > MAX_ACTOR_NAME_LENGTH) {
			return Result.failure(ActivityErrors.ACTIVITY_ACTOR_NAME_TOO_LONG);
		}

		if (!(ACTIVITY_TYPES_ARRAY as readonly string[]).includes(data.type)) {
			return Result.failure(ActivityErrors.ACTIVITY_TYPE_INVALID);
		}

		if (!data.entityLabel || data.entityLabel.trim().length < 1) {
			return Result.failure(ActivityErrors.ACTIVITY_ENTITY_LABEL_REQUIRED);
		}

		if (data.entityLabel.trim().length > MAX_ENTITY_LABEL_LENGTH) {
			return Result.failure(ActivityErrors.ACTIVITY_ENTITY_LABEL_TOO_LONG);
		}

		return Result.success(
			new WorkspaceActivity(
				ulid(),
				data.workspaceId.trim(),
				data.actor.userId.trim(),
				data.actor.name.trim(),
				data.type,
				data.entityId?.trim() || null,
				data.entityLabel.trim(),
				data.metadata,
				new Date(),
			),
		);
	}
}
