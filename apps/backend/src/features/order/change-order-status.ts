import { Result, Updated } from "@serviceflow/backend/shared/result";
import { OrderErrors } from "./common/order.errors";
import type { OrderStatus } from "./common/order.model";
import type { OrderRepository } from "./common/order-repository";

export interface ChangeOrderStatusCommand {
	orderId: string;
	status: Exclude<OrderStatus, "pendiente">;
}

interface ChangeOrderStatusProps {
	command: ChangeOrderStatusCommand;
	orderRepository: OrderRepository;
}

export const changeOrderStatusHandler = async ({
	command,
	orderRepository,
}: ChangeOrderStatusProps): Promise<Result<Updated>> => {
	const order = await orderRepository.getById(command.orderId);

	if (!order) {
		return Result.failure(OrderErrors.ORDER_NOT_FOUND);
	}

	const transitionResult =
		command.status === "entregada" ? order.deliver() : order.cancel();

	if (transitionResult.isFailure) {
		return Result.failure(transitionResult.error);
	}

	await orderRepository.updateStatus(order);

	return Updated.toResult();
};
