import type { UserBus } from "@serviceflow/backend/features/user/common/user.bus";
import { UserErrors } from "@serviceflow/backend/features/user/common/user.errors";
import { EnsureUserExistsCommand } from "@serviceflow/backend/features/user/ensure-user-exists";
import { GetUserByExternalIdQuery } from "@serviceflow/backend/features/user/get-by-external-id";
import { Created, Result } from "../result";

export interface MockUser {
	id: string;
	email: string;
	name: string;
	lastName: string | null;
	pictureUrl: string | null;
	externalId: string;
}

export const createInMemoryUserBus = (initialUsers: MockUser[] = []) => {
	const usersMap = new Map<string, MockUser>(
		initialUsers.map((u) => [u.externalId, u]),
	);

	const handler = async (message: unknown) => {
		if (message instanceof EnsureUserExistsCommand) {
			const cmd = message.value;

			if (!usersMap.has(cmd.externalId)) {
				usersMap.set(cmd.externalId, {
					id: `usr_${Math.random().toString(36).substring(2, 9)}`,
					externalId: cmd.externalId,
					email: cmd.email,
					name: cmd.name,
					lastName: cmd.lastName ?? null,
					pictureUrl: cmd.pictureUrl ?? null,
				});
			}

			return Result.success(new Created());
		}

		if (message instanceof GetUserByExternalIdQuery) {
			const query = message.value;
			const user = usersMap.get(query.externalId);

			if (!user) {
				return Result.failure(UserErrors.USER_NOT_FOUND);
			}

			return Result.success(user);
		}

		throw new Error(
			`[UserBusMock] Comando/Query no soportado: ${message?.constructor?.name}`,
		);
	};

	return handler as UserBus;
};
