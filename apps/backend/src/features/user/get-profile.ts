import { Result } from "@serviceflow/backend/shared/result";
import type { UserDto } from "./common/user.dto";
import { UserErrors } from "./common/user.errors";
import type { UserRepository } from "./common/user-repository";

interface GetProfileQuery {
	userId: string;
}

interface GetProfileQueryHandlerProps {
	query: GetProfileQuery;
	repository: UserRepository;
}

export const getProfileHandler = async ({
	query,
	repository,
}: GetProfileQueryHandlerProps): Promise<Result<UserDto>> => {
	const user = await repository.getById(query.userId);

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
