import { Result, Updated } from "@serviceflow/backend/shared/result";
import { ulid } from "ulidx";
import { DeviceErrors } from "./device.errors";

type CreateDevice = Omit<
	Device,
	| "id"
	| "createdAt"
	| "updatedAt"
	| "_components"
	| "components"
	| "addComponent"
>;

export class Device {
	private constructor(
		public readonly id: string,
		public readonly workspaceId: string,
		public readonly clientId: string,
		public readonly serialNumber: string,
		public readonly brand: string,
		public readonly model: string,
		private _components: DeviceComponent[],
		public readonly createdAt: Date,
		public readonly updatedAt: Date,
	) {}

	static create(values: CreateDevice): Result<Device> {
		if (!values.workspaceId || values.workspaceId.trim().length < 1) {
			return Result.failure(DeviceErrors.DEVICE_WORKSPACE_ID_REQUIRED);
		}

		if (!values.clientId || values.clientId.trim().length < 1) {
			return Result.failure(DeviceErrors.DEVICE_CLIENT_ID_REQUIRED);
		}

		if (!values.serialNumber || values.serialNumber.trim().length < 1) {
			return Result.failure(DeviceErrors.DEVICE_SERIAL_NUMBER_REQUIRED);
		}

		if (values.serialNumber.trim().length > 200) {
			return Result.failure(DeviceErrors.DEVICE_SERIAL_NUMBER_TOO_LONG);
		}

		if (!values.brand || values.brand.trim().length < 1) {
			return Result.failure(DeviceErrors.DEVICE_BRAND_REQUIRED);
		}

		if (values.brand.trim().length > 50) {
			return Result.failure(DeviceErrors.DEVICE_BRAND_TOO_LONG);
		}

		if (!values.model || values.model.trim().length < 1) {
			return Result.failure(DeviceErrors.DEVICE_MODEL_REQUIRED);
		}

		if (values.model.trim().length > 100) {
			return Result.failure(DeviceErrors.DEVICE_MODEL_TOO_LONG);
		}

		const now = new Date();
		return Result.success(
			new Device(
				ulid(),
				values.workspaceId.trim(),
				values.clientId.trim(),
				values.serialNumber.trim(),
				values.brand.trim(),
				values.model.trim(),
				[],
				now,
				now,
			),
		);
	}

	get components(): Readonly<DeviceComponent[]> {
		return structuredClone(this._components);
	}

	addComponent(values: AddComponent): Result<Updated> {
		const component = DeviceComponent.create(values);
		if (component.isFailure) return Result.failure(component.error);

		this._components.push(component.value);
		return Updated.toResult();
	}

	static reconstitute(values: {
		id: string;
		workspaceId: string;
		clientId: string;
		serialNumber: string;
		brand: string;
		model: string;
		components: DeviceComponent[];
		createdAt: Date;
		updatedAt: Date;
	}): Device {
		return new Device(
			values.id,
			values.workspaceId,
			values.clientId,
			values.serialNumber,
			values.brand,
			values.model,
			values.components,
			values.createdAt,
			values.updatedAt,
		);
	}
}

type AddComponent = Omit<DeviceComponent, "id" | "createdAt" | "updatedAt">;

export type ComponentType = "supply" | "replacement_part" | "other";

export class DeviceComponent {
	private constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly partNumber: string,
		public readonly type: ComponentType,
		public readonly createdAt: Date,
		public readonly updatedAt: Date,
	) {}

	static create(values: AddComponent): Result<DeviceComponent> {
		if (!values.name || values.name.trim().length < 1) {
			return Result.failure(DeviceErrors.DEVICE_COMPONENT_NAME_REQUIRED);
		}

		if (values.name.trim().length > 150) {
			return Result.failure(DeviceErrors.DEVICE_COMPONENT_NAME_TOO_LONG);
		}

		if (!values.partNumber || values.partNumber.trim().length < 1) {
			return Result.failure(DeviceErrors.DEVICE_COMPONENT_PART_NUMBER_REQUIRED);
		}

		if (values.partNumber.trim().length > 100) {
			return Result.failure(DeviceErrors.DEVICE_COMPONENT_PART_NUMBER_TOO_LONG);
		}

		if (!values.type) {
			return Result.failure(DeviceErrors.DEVICE_COMPONENT_TYPE_REQUIRED);
		}

		const now = new Date();
		return Result.success(
			new DeviceComponent(
				ulid(),
				values.name.trim(),
				values.partNumber.trim(),
				values.type,
				now,
				now,
			),
		);
	}

	static reconstitute(values: {
		id: string;
		name: string;
		partNumber: string;
		type: ComponentType;
		createdAt: Date;
		updatedAt: Date;
	}): DeviceComponent {
		return new DeviceComponent(
			values.id,
			values.name,
			values.partNumber,
			values.type,
			values.createdAt,
			values.updatedAt,
		);
	}
}
