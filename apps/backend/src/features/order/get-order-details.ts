import { Result } from "@serviceflow/backend/shared/result";
import type { UserRepository } from "../user/common/user-repository";
import { OrderErrors } from "./common/order.errors";
import { OrderDetailsReadModel } from "./common/order-details.read-model";
import type { OrderRepository } from "./common/order-repository";

interface GetOrderDetailsQuery {
	workspaceId: string;
	orderId: string;
}

interface GetOrderDetailsProps {
	query: GetOrderDetailsQuery;
	orderRepository: OrderRepository;
	userRepository: UserRepository;
}

export const getOrderDetailsHandler = async ({
	query,
	orderRepository,
	userRepository,
}: GetOrderDetailsProps): Promise<Result<OrderDetailsReadModel>> => {
	const order = await orderRepository.getById(query.orderId);

	if (!order || order.workspaceId !== query.workspaceId) {
		return Result.failure(OrderErrors.ORDER_NOT_FOUND);
	}

	const userPictureUrl = await userRepository.getPictureUrlById(order.userId);

	const details = OrderDetailsReadModel.create({
		order,
		technicianPictureUrl: userPictureUrl,
	});

	return Result.success(details);
};
