import type { RealtimePublisher } from "@serviceflow/backend/shared/realtime/realtime-publisher";
import { Result } from "@serviceflow/backend/shared/result";
import { UserErrors } from "../user/common/user.errors";
import type { UserRepository } from "../user/common/user-repository";
import { OrderErrors } from "./common/order.errors";
import type { OrderRepository } from "./common/order-repository";

interface Input {
	query: {
		orderId: string;
		workspaceId: string;
		userId: string;
	};
	orderRepository: OrderRepository;
	userRepository: UserRepository;
	realtimePublisher: RealtimePublisher;
}

export const publishOrderCreatedEvent = async ({
	query,
	orderRepository,
	userRepository,
	realtimePublisher,
}: Input): Promise<Result<void>> => {
	const [order, user] = await Promise.all([
		orderRepository.getById(query.orderId),
		userRepository.getById(query.userId),
	]);

	if (!order || order.workspaceId !== query.workspaceId) {
		return Result.failure(OrderErrors.ORDER_NOT_FOUND);
	}

	if (!user) {
		return Result.failure(UserErrors.USER_NOT_FOUND);
	}

	await realtimePublisher.publish({
		topic: `workspace:${query.workspaceId}`,
		event: "ORDER_CREATED",
		data: {
			orderId: order.id,
			createdAt: order.createdAt.toISOString(),
			createdBy: `${user.name} ${user.lastName ?? ""}`.trim(),
			technicianPicture: user.pictureUrl,
		},
	});

	return Result.success();
};
