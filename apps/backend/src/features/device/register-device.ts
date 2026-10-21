import { Result } from "@serviceflow/backend/shared/result";
import { WorkspaceActivity } from "../activity/common/activity.model";
import { UserErrors } from "../user/common/user.errors";
import type { UserRepository } from "../user/common/user-repository";
import { DeviceErrors } from "./common/device.errors";
import { type ComponentType, Device } from "./common/device.model";
import type { DeviceRepository } from "./common/device-repository";
import type { DevicesUnitOfWork } from "./common/devices.unit-of-work";

export interface RegisterDeviceCommand {
	workspaceId: string;
	userId: string;
	clientId: string;
	serialNumber: string;
	brand: string;
	model: string;

	components: {
		name: string;
		partNumber: string;
		type: ComponentType;
	}[];
}

interface RegisterDeviceProps {
	command: RegisterDeviceCommand;
	repository: DeviceRepository;
	userRepository: UserRepository;
	unitOfWork: DevicesUnitOfWork;
}

const CONSUMABLE_COMPONENT_TYPE: ComponentType = "supply";

export const registerDeviceHandler = async (props: RegisterDeviceProps) => {
	const { command, repository, userRepository, unitOfWork } = props;

	const deviceExists = await repository.exists({
		serialNumber: command.serialNumber,
		workspaceId: command.workspaceId,
	});

	if (deviceExists) {
		return Result.failure(DeviceErrors.DEVICE_ALREADY_EXISTS);
	}

	const newDevice = Device.create({
		workspaceId: command.workspaceId,
		clientId: command.clientId,
		serialNumber: command.serialNumber,
		brand: command.brand,
		model: command.model,
	});

	if (newDevice.isFailure) {
		return Result.failure(newDevice.error);
	}

	const device = newDevice.value;

	for (const componentInput of command.components) {
		const addResult = device.addComponent(componentInput);
		if (addResult.isFailure) {
			return Result.failure(addResult.error);
		}
	}

	const user = await userRepository.getById(command.userId);

	if (!user) return Result.failure(UserErrors.USER_NOT_FOUND);

	const actor = {
		userId: user.id,
		name: `${user.name} ${user.lastName ?? ""}`.trim(),
	};

	const deviceFullName = `${device.brand} ${device.model}`;

	const deviceActivityResult = WorkspaceActivity.deviceRegistered({
		workspaceId: device.workspaceId,
		actor,
		deviceId: device.id,
		deviceFullName,
	});

	if (deviceActivityResult.isFailure) {
		return Result.failure(deviceActivityResult.error);
	}

	const consumablesCount = device.components.filter(
		(component) => component.type === CONSUMABLE_COMPONENT_TYPE,
	).length;

	const consumablesActivityResult =
		consumablesCount > 0
			? WorkspaceActivity.consumablesRegistered({
					workspaceId: device.workspaceId,
					actor,
					deviceId: device.id,
					deviceFullName,
					count: consumablesCount,
				})
			: null;

	if (consumablesActivityResult?.isFailure) {
		return Result.failure(consumablesActivityResult.error);
	}

	await unitOfWork.transaction(async ({ devices, activities }) => {
		await devices.save(device);
		await activities.save(deviceActivityResult.value);

		if (consumablesActivityResult) {
			await activities.save(consumablesActivityResult.value);
		}
	});

	return Result.success(device.id);
};
