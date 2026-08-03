import type { UserBus } from "@serviceflow/backend/features/user/common/user.bus";
import { EnsureUserExistsCommand } from "@serviceflow/backend/features/user/ensure-user-exists";
import { GetUserByExternalIdQuery } from "@serviceflow/backend/features/user/get-by-external-id";
import Elysia from "elysia";
import type { TokenVerifier, UserIdentityProvider } from "../auth";
import { AuthErrors } from "../auth/auth.errors";
import { respond } from "./respond";

export interface AuthPluginConfig {
	tokenVerifier: TokenVerifier;
	userIdentityProvider: UserIdentityProvider;
	userBus: UserBus;
}

export const createAuthPlugin = ({
	tokenVerifier,
	userIdentityProvider,
	userBus,
}: AuthPluginConfig) =>
	new Elysia({ name: "auth-plugin" }).macro("auth", (enabled: boolean) => ({
		async resolve({ headers, status, set }) {
			if (!enabled) return;

			const authorization = headers.authorization;
			if (!authorization?.startsWith("Bearer ")) {
				return status(
					AuthErrors.MISSING_HEADER.statusCode,
					respond.failure(AuthErrors.MISSING_HEADER, set),
				);
			}

			const token = authorization.slice(7);
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
				const fetchedDetails =
					await userIdentityProvider.getUserDetails(externalId);

				const registerUser = await userBus(
					new EnsureUserExistsCommand({
						externalId,
						email: fetchedDetails.emailAddress,
						name: fetchedDetails.firstName,
						lastName: fetchedDetails.lastName ?? undefined,
						pictureUrl: fetchedDetails.imageUrl,
					}),
				);

				if (registerUser.isFailure) {
					return status(
						registerUser.error.statusCode,
						respond.failure(registerUser.error, set),
					);
				}

				const newUser = await userBus(
					new GetUserByExternalIdQuery({ externalId }),
				);
				if (newUser.isFailure) {
					return status(
						newUser.error.statusCode,
						respond.failure(newUser.error, set),
					);
				}

				userId = newUser.value.id;
			}

			return {
				auth: {
					userId,
					externalId,
				},
			};
		},
	}));

export type AuthPlugin = ReturnType<typeof createAuthPlugin>;
