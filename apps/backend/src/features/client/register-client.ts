import { Created, Result } from "@serviceflow/backend/shared/result";
import { ClientErrors } from "./common/client.errors";
import { Client } from "./common/client.model";
import type { ClientRepository } from "./common/client-repository";

interface RegisterClientCommand {
	name: string;
	email: string;
	phoneNumber: string;
	workspaceId: string;
	location: string;
}

interface props {
	command: RegisterClientCommand;
	repository: ClientRepository;
}

export const registerClientCommandHandler = async ({
	repository,
	command,
}: props) => {
	const clientExists = await repository.clientExists({
		email: command.email,
		phone: command.phoneNumber,
	});

	if (clientExists) return Result.failure(ClientErrors.CLIENT_ALREADY_EXISTS);

	const newClient = Client.create({ ...command });
	if (newClient.isFailure) return Result.failure(newClient.error);

	await repository.save(newClient.value);
	return Created.toResult();
};
