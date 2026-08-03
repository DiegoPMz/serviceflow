import { createRemoteJWKSet, jwtVerify } from "jose";
import { JOSEError } from "jose/errors";
import { clerkConfig } from "../config";
import { Result } from "../result";
import { AuthErrors } from "./auth.errors";
import type { AuthenticatedUser, TokenVerifier } from "./token-verifier";

const jwks = createRemoteJWKSet(new URL(clerkConfig.jwksUrl));

export const clerkTokenVerifier: TokenVerifier = {
	verify: async (token): Promise<Result<AuthenticatedUser>> => {
		try {
			const { payload } = await jwtVerify(token, jwks, {
				algorithms: ["RS256"],
				issuer: clerkConfig.issuer,
				requiredClaims: ["sub", "sid"],
			});

			if (
				typeof payload.sub !== "string" ||
				typeof payload.sid !== "string" ||
				(payload.userId && typeof payload.userId !== "string")
			) {
				return Result.failure(AuthErrors.INVALID_TOKEN);
			}

			return Result.success({
				externalId: payload.sub,
				sessionId: payload.sid,
				userId: (payload.userId as string) ?? null,
			});
		} catch (error: unknown) {
			if (error instanceof JOSEError) {
				return Result.failure(AuthErrors.INVALID_TOKEN);
			}

			throw error;
		}
	},
};
