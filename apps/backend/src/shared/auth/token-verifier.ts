import type { Result } from "../result";

export interface AuthenticatedUser {
	externalId: string;
	sessionId: string;
}

export interface TokenVerifier {
	verify(token: string): Promise<Result<AuthenticatedUser>>;
}
