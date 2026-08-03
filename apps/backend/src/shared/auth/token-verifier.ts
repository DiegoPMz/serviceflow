import type { Result } from "../result";

export interface AuthenticatedUser {
	externalId: string;
	sessionId: string;
	userId: string | null;
}

export interface TokenVerifier {
	verify(token: string): Promise<Result<AuthenticatedUser>>;
}
