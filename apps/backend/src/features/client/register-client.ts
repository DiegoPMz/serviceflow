import { Result } from "@serviceflow/backend/shared/result";
import { WorkspaceActivity } from "../activity/common/activity.model";
import { UserErrors } from "../user/common/user.errors";
import type { UserRepository } from "../user/common/user-repository";
import { ClientErrors } from "./common/client.errors";
import { Client } from "./common/client.model";
import type { ClientRepository } from "./common/client-repository";
import type { ClientsUnitOfWork } from "./common/clients.unit-of-work";

export interface RegisterClientCommand {
	workspaceId: string;
	userId: string;
	name: string;
	email: string;
	phoneNumber: string;
	location: string;
}

interface RegisterClientProps {
	command: RegisterClientCommand;
	repository: ClientRepository;
	userRepository: UserRepository;
	unitOfWork: ClientsUnitOfWork;
}

export const registerClientHandler = async ({
	repository,
	userRepository,
	unitOfWork,
	command,
}: RegisterClientProps) => {
	const clientExists = await repository.clientExists({
		email: command.email,
		phone: command.phoneNumber,
	});

	if (clientExists) {
		return Result.failure(ClientErrors.CLIENT_ALREADY_EXISTS);
	}

	const newClient = Client.create({
		name: command.name,
		email: command.email,
		phoneNumber: command.phoneNumber,
		workspaceId: command.workspaceId,
		location: command.location,
	});

	if (newClient.isFailure) {
		return Result.failure(newClient.error);
	}

	const user = await userRepository.getById(command.userId);

	if (!user) {
		return Result.failure(UserErrors.USER_NOT_FOUND);
	}

	const client = newClient.value;

	const activityResult = WorkspaceActivity.clientCreated({
		workspaceId: client.workspaceId,
		actor: {
			userId: user.id,
			name: `${user.name} ${user.lastName ?? ""}`.trim(),
		},
		clientId: client.id,
		clientName: client.name,
	});

	if (activityResult.isFailure) {
		return Result.failure(activityResult.error);
	}

	await unitOfWork.transaction(async ({ clients, activities }) => {
		await clients.save(client);
		await activities.save(activityResult.value);
	});

	return Result.success(client.id);
};
