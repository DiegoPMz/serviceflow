import type { Eden } from "@/shared/http/client";
import { normalizeEdenError } from "@/shared/lib/normalize-eden-error";
import type { RegisterDeviceInput } from "./register-device.schema";

export interface RegisterDeviceUseCaseInput {
	workspaceId: string;
	deviceData: RegisterDeviceInput;
	eden: Eden;
}

export interface RegisterDeviceUseCaseResult {
	deviceId: string;
}

export async function registerDevice({
	workspaceId,
	deviceData,
	eden,
}: RegisterDeviceUseCaseInput): Promise<RegisterDeviceUseCaseResult> {
	const { data, error } = await eden.v1
		.workspaces({ workspaceId })
		.devices.post({
			clientId: deviceData.clientId,
			serialNumber: deviceData.serialNumber,
			brand: deviceData.brand,
			model: deviceData.model,
			components: deviceData.components ?? [],
		});

	if (error) {
		normalizeEdenError(error);
	}

	if (!data?.deviceId) {
		throw new Error("No se recibió el ID del dispositivo registrado.");
	}

	return { deviceId: data.deviceId };
}
