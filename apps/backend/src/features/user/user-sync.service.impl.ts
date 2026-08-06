import type {
	UserIdentityProvider,
	UserSyncService,
} from "@serviceflow/backend/shared/auth";
import { Result } from "@serviceflow/backend/shared/result";
import { User } from "./common/user.model";
import type { UserRepository } from "./common/user-repository";

export const userSyncServiceImp = ({
	userRepository,
	userIdentityProvider,
}: {
	userRepository: UserRepository;
	userIdentityProvider: UserIdentityProvider;
}): UserSyncService => ({
	ensureUserSynced: async (externalId: string): Promise<Result<User>> => {
		const userDb = await userRepository.getByExternalId(externalId);

		if (userDb) {
			return Result.success(userDb);
		}

		const { emailAddress, firstName, imageUrl, lastName } =
			await userIdentityProvider.getUserDetails(externalId);

		const newUserResult = User.create({
			externalId,
			lastName: lastName ?? undefined,
			email: emailAddress,
			name: firstName,
			pictureUrl: imageUrl,
		});

		if (newUserResult.isFailure) {
			return Result.failure(newUserResult.error);
		}

		const user = newUserResult.value;

		await userRepository.transaction(async (txRepo) => await txRepo.save(user));

		await userIdentityProvider.updatePublicMetadata(externalId, {
			userId: user.id,
		});

		return Result.success(newUserResult.value);
	},
});
