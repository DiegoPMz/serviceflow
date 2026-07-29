import { Created, Result } from "@serviceflow/backend/shared/result";
import { User } from "./common/user.model";
import type { UserRepository } from "./common/user-repository";

export class EnsureUserExistsCommand {
	constructor(
		public readonly value: {
			readonly externalId: string;
			readonly email: string;
			readonly name: string;
			readonly lastName?: string;
			readonly pictureUrl?: string;
			readonly phone?: string;
		},
	) {}
}

interface EnsureUserExistsProps {
	command: EnsureUserExistsCommand["value"];
	repository: UserRepository;
}

export const ensureUserExistsHandler = async ({
	command,
	repository,
}: EnsureUserExistsProps): Promise<Result<Created>> => {
	const userDb = await repository.getByExternalId(command.externalId);

	if (userDb) {
		return Created.toResult();
	}

	const userResult = User.create({
		externalId: command.externalId,
		email: command.email ?? "",
		name: command.name ?? "",
		lastName: command.lastName,
		phone: command.phone,
		pictureUrl: command.pictureUrl,
	});

	if (userResult.error) {
		return Result.failure(userResult.error);
	}

	await repository.save(userResult.value);
	return Created.toResult();
};
