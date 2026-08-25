import Elysia from "elysia";
import type { TokenVerifier, UserSyncService } from "../auth";
import { AuthErrors } from "../auth/auth.errors";
import { respond } from "./respond";

export interface AuthPluginConfig {
	tokenVerifier: TokenVerifier;
	userSyncService: UserSyncService;
}

export const createAuthPlugin = ({
	tokenVerifier,
	userSyncService,
}: AuthPluginConfig) =>
	new Elysia({ name: "auth-plugin" }).macro("auth", (enabled: boolean) => ({
		async resolve({ headers, status, set, query }) {
			if (!enabled) return;

			let token: string | undefined;

			const authorization = headers.authorization;
			if (authorization?.startsWith("Bearer ")) {
				token = authorization.slice(7);
			} else if (typeof query?.token === "string" && query.token) {
				token = query.token;
			}

			if (!token) {
				return status(
					AuthErrors.MISSING_HEADER.statusCode,
					respond.failure(AuthErrors.MISSING_HEADER, set),
				);
			}

			const verifyResult = await tokenVerifier.verify(token);

			if (verifyResult.isFailure) {
				return status(
					verifyResult.error.statusCode,
					respond.failure(verifyResult.error, set),
				);
			}

			const externalId = verifyResult.value.externalId;
			let userId = verifyResult.value.userId;

			if (!userId) {
				const syncResult = await userSyncService.ensureUserSynced(externalId);

				if (syncResult.isFailure) {
					return status(
						syncResult.error.statusCode,
						respond.failure(syncResult.error, set),
					);
				}

				userId = syncResult.value.id;
			}

			return {
				auth: {
					userId: userId as string,
					externalId,
				},
			};
		},
	}));

export type AuthPlugin = ReturnType<typeof createAuthPlugin>;
