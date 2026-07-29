import { db } from "@serviceflow/backend/shared/database";
import { withTransaction } from "@serviceflow/backend/shared/database/utils/with-transaction";
import {
	EnsureUserExistsCommand,
	ensureUserExistsHandler,
} from "../ensure-user-exists";
import {
	GetUserByExternalIdQuery,
	getUserByExternalIdHandler,
} from "../get-by-external-id";
import { userDrizzleRepository } from "./user-drizzle-repository";

export function userBus(
	message: EnsureUserExistsCommand,
): ReturnType<typeof ensureUserExistsHandler>;

export function userBus(
	message: GetUserByExternalIdQuery,
): ReturnType<typeof getUserByExternalIdHandler>;

export async function userBus(message: UserMessages) {
	if (message instanceof EnsureUserExistsCommand) {
		return withTransaction(db, async (tx) =>
			ensureUserExistsHandler({
				command: message.value,
				repository: userDrizzleRepository(tx),
			}),
		);
	}

	if (message instanceof GetUserByExternalIdQuery) {
		return getUserByExternalIdHandler({
			query: message.value,
			repository: userDrizzleRepository(db),
		});
	}

	throw new Error("Comando no reconocido");
}

type UserMessages = EnsureUserExistsCommand | GetUserByExternalIdQuery;
