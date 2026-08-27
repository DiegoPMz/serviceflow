import Elysia from "elysia";
import type { TokenVerifier, UserSyncService } from "../auth";
import { AuthErrors } from "../auth/auth.errors";
import { ErrorDetailsException } from "../result";

export interface AuthPluginConfig {
	tokenVerifier: TokenVerifier;
	userSyncService: UserSyncService;
}

export const createAuthPlugin = ({
	tokenVerifier,
	userSyncService,
}: AuthPluginConfig) =>
	new Elysia({ name: "auth-plugin" }).macro("auth", (enabled: boolean) => ({
		async resolve({ headers, status, query }) {
			if (!enabled) return;

			let token: string | undefined;

			const authorization = headers.authorization;
			if (authorization?.startsWith("Bearer ")) {
				token = authorization.slice(7);
			} else if (typeof query?.token === "string" && query.token) {
				token = query.token;
			}

			if (!token) {
				return status(AuthErrors.MISSING_HEADER.statusCode, {
					...AuthErrors.MISSING_HEADER,
				});
			}

			const verifyResult = await tokenVerifier.verify(token);

			if (verifyResult.isFailure) {
				return status(AuthErrors.UNAUTHENTICATED_USER.statusCode, {
					...AuthErrors.UNAUTHENTICATED_USER,
				});
			}

			const externalId = verifyResult.value.externalId;
			let userId = verifyResult.value.userId;

			if (!userId) {
				const syncResult = await userSyncService.ensureUserSynced(externalId);

				if (syncResult.isFailure) {
					throw ErrorDetailsException.of(syncResult.error);
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
