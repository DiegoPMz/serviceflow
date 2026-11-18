import { Result } from "@serviceflow/backend/shared/result";
import { ClientErrors } from "./common/client.errors";
import type { ClientReadModel } from "./common/client.read-model";
import type { ClientRepository } from "./common/client-repository";

type GetClientQuery = {
	workspaceId: string;
	clientId: string;
};

interface GetClientProps {
	query: GetClientQuery;
	repository: ClientRepository;
}

export const getClientHandler = async ({
	query,
	repository,
}: GetClientProps): Promise<Result<ClientReadModel>> => {
	const client = await repository.getReadModelById(
		query.clientId,
		query.workspaceId,
	);

	if (!client) {
		return Result.failure(ClientErrors.CLIENT_NOT_FOUND);
	}

	return Result.success(client);
};
