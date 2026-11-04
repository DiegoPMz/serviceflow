import type { Eden } from "@/shared/http/client";
import { normalizeEdenError } from "@/shared/lib/normalize-eden-error";
import type { CreateOrderInput } from "./create-order.schema";

export interface CreateOrderUseCaseInput {
	workspaceId: string;
	orderData: CreateOrderInput;
	eden: Eden;
}

export interface CreateOrderUseCaseResult {
	orderId: string;
}

export async function createOrder({
	workspaceId,
	orderData,
	eden,
}: CreateOrderUseCaseInput): Promise<CreateOrderUseCaseResult> {
	const { data, error } = await eden.v1
		.workspaces({ workspaceId })
		.orders.post({
			clientId: orderData.clientId,
			deviceId: orderData.deviceId,
			serviceType: orderData.serviceType,
			observations: orderData.observations,
			components: orderData.components ?? [],
		});

	if (error) {
		normalizeEdenError(error);
	}

	if (!data?.orderId) {
		throw new Error("No se recibió el ID de la orden creada.");
	}

	return { orderId: data.orderId };
}
