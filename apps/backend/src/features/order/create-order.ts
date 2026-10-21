import { Result } from "@serviceflow/backend/shared/result";
import { WorkspaceActivity } from "../activity/common/activity.model";
import { ClientErrors } from "../client/common/client.errors";
import type { ClientRepository } from "../client/common/client-repository";
import { DeviceErrors } from "../device/common/device.errors";
import type { DeviceComponent } from "../device/common/device.model";
import type { DeviceRepository } from "../device/common/device-repository";
import { UserErrors } from "../user/common/user.errors";
import type { UserRepository } from "../user/common/user-repository";
import { workspaceErrors } from "../workspace/common/workspace.errors";
import type { WorkspaceRepository } from "../workspace/common/workspace-repository";
import { Folio, Order } from "./common/order.model";
import type { OrdersUnitOfWork } from "./common/orders.unit-of-work";

export interface CreateOrderCommand {
	workspaceId: string;
	userId: string;

	clientId: string;
	deviceId: string;
	components: {
		id: string;
		quantity: number;
	}[];

	observations: string;
}

interface CreateOrderHandlerProps {
	command: CreateOrderCommand;
	clientRepository: ClientRepository;
	deviceRepository: DeviceRepository;
	workspaceRepository: WorkspaceRepository;
	userRepository: UserRepository;
	unitOfWork: OrdersUnitOfWork;
}

export const createOrderHandler = async ({
	command,
	clientRepository,
	deviceRepository,
	workspaceRepository,
	userRepository,
	unitOfWork,
}: CreateOrderHandlerProps): Promise<Result<string>> => {
	const [client, device, workspace, user] = await Promise.all([
		clientRepository.getByIds(command.clientId, command.workspaceId),
		deviceRepository.getByIds(command.deviceId, command.workspaceId),
		workspaceRepository.getById(command.workspaceId),
		userRepository.getById(command.userId),
	]);

	if (!client) {
		return Result.failure(ClientErrors.CLIENT_NOT_FOUND);
	}

	if (!device) {
		return Result.failure(DeviceErrors.DEVICE_NOT_FOUND);
	}

	if (!workspace) {
		return Result.failure(workspaceErrors.WORKSPACE_NOT_FOUND);
	}

	if (!user) {
		return Result.failure(UserErrors.USER_NOT_FOUND);
	}

	const folioResult = Folio.create({
		workspaceOrderCount: workspace.orderCount,
		workspacePrefix: workspace.prefix,
	});

	if (folioResult.isFailure) {
		return Result.failure(folioResult.error);
	}

	const folio = folioResult.value;

	const orderResult = Order.create({
		userId: command.userId,
		workspaceId: workspace.id,
		clientId: client.id,
		deviceId: device.id,
		observations: command.observations,
		folio: folio,

		clientNameSnapshot: client.name,
		clientEmailSnapshot: client.email,
		clientPhoneSnapshot: client.phoneNumber,
		clientLocationSnapshot: client.location,
		deviceBrandSnapshot: device.brand,
		deviceModelSnapshot: device.model,
		deviceSerialNumberSnapshot: device.serialNumber,
		userNameSnapshot: `${user.name} ${user.lastName ?? ""}`,
	});

	if (orderResult.isFailure) {
		return Result.failure(orderResult.error);
	}

	const order = orderResult.value;

	const deviceComponentsById = new Map<string, DeviceComponent>();
	device.components.forEach((component) => {
		deviceComponentsById.set(component.id, component);
	});

	for (const requestedComponent of command.components) {
		const matchedComponent = deviceComponentsById.get(requestedComponent.id);

		if (!matchedComponent) {
			return Result.failure(
				DeviceErrors.DEVICE_COMPONENT_NOT_FOUND(requestedComponent.id),
			);
		}

		const addComponentResult = order.addComponent({
			deviceComponentId: matchedComponent.id,
			name: matchedComponent.name,
			partNumber: matchedComponent.partNumber,
			type: matchedComponent.type,
			quantity: requestedComponent.quantity,
		});

		if (addComponentResult.isFailure) {
			return Result.failure(addComponentResult.error);
		}
	}

	const activityResult = WorkspaceActivity.orderCreated({
		workspaceId: order.workspaceId,
		actor: {
			userId: user.id,
			name: `${user.name} ${user.lastName ?? ""}`.trim(),
		},
		orderId: order.id,
		folio: order.folio,
	});

	if (activityResult.isFailure) {
		return Result.failure(activityResult.error);
	}

	await unitOfWork.transaction(async ({ orders, workspaces, activities }) => {
		workspace.increaseCount();

		await orders.save(order);
		await workspaces.update(workspace);
		await activities.save(activityResult.value);
	});

	return Result.success(order.id);
};
