import { Result } from "@serviceflow/backend/shared/result";
import type { UserDto } from "./common/user.dto";
import { UserErrors } from "./common/user.errors";
import type { UserRepository } from "./common/user-repository";

export class GetUserByExternalIdQuery {
	public constructor(
		public readonly value: {
			readonly externalId: string;
		},
	) {}
}

interface GetUserByExternalIdHandlerProps {
	query: GetUserByExternalIdQuery["value"];
	repository: UserRepository;
}

export const getUserByExternalIdHandler = async ({
	query,
	repository,
}: GetUserByExternalIdHandlerProps): Promise<Result<UserDto>> => {
	const user = await repository.getByExternalId(query.externalId);

	if (!user) {
		return Result.failure(UserErrors.USER_NOT_FOUND);
	}

	return Result.success({
		id: user.id,
		email: user.email,
		name: user.name,
		lastName: user.lastName,
		pictureUrl: user.pictureUrl,
	});
};
