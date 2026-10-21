import { Result, Updated } from "@serviceflow/backend/shared/result";
import { WorkspaceActivity } from "../activity/common/activity.model";
import { UserErrors } from "../user/common/user.errors";
import type { UserRepository } from "../user/common/user-repository";
import { OrderErrors } from "./common/order.errors";
import type { OrderStatus } from "./common/order.model";
import type { OrderRepository } from "./common/order-repository";
import type { OrdersUnitOfWork } from "./common/orders.unit-of-work";

export interface ChangeOrderStatusCommand {
	workspaceId: string;
	userId: string;
	orderId: string;
	status: Exclude<OrderStatus, "pendiente">;
}

interface ChangeOrderStatusProps {
	command: ChangeOrderStatusCommand;
	orderRepository: OrderRepository;
	userRepository: UserRepository;
	unitOfWork: OrdersUnitOfWork;
}

export const changeOrderStatusHandler = async ({
	command,
	orderRepository,
	userRepository,
	unitOfWork,
}: ChangeOrderStatusProps): Promise<Result<Updated>> => {
	const [order, user] = await Promise.all([
		orderRepository.getById(command.orderId),
		userRepository.getById(command.userId),
	]);

	if (!order || order.workspaceId !== command.workspaceId) {
		return Result.failure(OrderErrors.ORDER_NOT_FOUND);
	}

	if (!user) {
		return Result.failure(UserErrors.USER_NOT_FOUND);
	}

	const previousStatus = order.status;

	const transitionResult =
		command.status === "entregada" ? order.deliver() : order.cancel();

	if (transitionResult.isFailure) {
		return Result.failure(transitionResult.error);
	}

	const activityResult = WorkspaceActivity.orderStatusChanged({
		workspaceId: order.workspaceId,
		actor: {
			userId: user.id,
			name: `${user.name} ${user.lastName ?? ""}`.trim(),
		},
		orderId: order.id,
		folio: order.folio,
		previousStatus,
		newStatus: order.status,
	});

	if (activityResult.isFailure) {
		return Result.failure(activityResult.error);
	}

	await unitOfWork.transaction(async ({ orders, activities }) => {
		await orders.updateStatus(order);
		await activities.save(activityResult.value);
	});

	return Updated.toResult();
};
