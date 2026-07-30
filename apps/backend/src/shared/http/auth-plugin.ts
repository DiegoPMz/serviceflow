import Elysia from "elysia";
import type { TokenVerifier, UserIdentityProvider } from "../auth";
import { AuthErrors } from "../auth/auth.errors";

export interface AuthPluginConfig {
	tokenVerifier: TokenVerifier;
	userIdentityProvider: UserIdentityProvider;
}

export const createAuthPlugin = ({
	tokenVerifier,
	userIdentityProvider,
}: AuthPluginConfig) =>
	new Elysia({ name: "auth-plugin" }).macro("auth", (enabled: boolean) => ({
		async resolve({ headers, status }) {
			if (!enabled) return;

			const authorization = headers.authorization;
			if (!authorization?.startsWith("Bearer ")) {
				return status(
					AuthErrors.MISSING_HEADER.statusCode,
					AuthErrors.MISSING_HEADER,
				);
			}

			const token = authorization.slice(7);
			const verifyResult = await tokenVerifier.verify(token);

			if (verifyResult.isFailure) {
				return status(verifyResult.error.statusCode, verifyResult.error);
			}

			return {
				auth: {
					...verifyResult.value,
					userDetails: () =>
						userIdentityProvider.getUserDetails(verifyResult.value.externalId),
				},
			};
		},
	}));

export type AuthPlugin = ReturnType<typeof createAuthPlugin>;
