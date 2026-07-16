import { Created, Result } from "@serviceflow/backend/shared/result";
import { DeviceErrors } from "./common/device.errors";
import { type ComponentType, Device } from "./common/device.model";
import type { DeviceRepository } from "./common/device-repository";

interface RegisterDeviceCommand {
	workspaceId: string;
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
}

export const registerDeviceCommandHandler = async (
	props: RegisterDeviceProps,
) => {
	const { command, repository } = props;

	const deviceExists = await repository.exists({
		serialNumber: command.serialNumber,
		workspaceId: command.workspaceId,
	});

	if (deviceExists) return Result.failure(DeviceErrors.DEVICE_ALREADY_EXISTS);

	const newDevice = Device.create({
		workspaceId: command.workspaceId,
		clientId: command.clientId,
		serialNumber: command.serialNumber,
		brand: command.brand,
		model: command.model,
	});

	if (newDevice.isFailure) return Result.failure(newDevice.error);

	const device = newDevice.value;

	for (const component of command.components) {
		const res = device.addComponent(component);
		if (res.isFailure) return Result.failure(res.error);
	}

	await repository.save(device);

	return Created.toResult();
};
