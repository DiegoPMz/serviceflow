/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
import { spyOn } from "bun:test";
import { exportJWK, generateKeyPair, type JWK, SignJWT } from "jose";
import type { ClerkUser } from "../auth/clerk-identity-provider";

let testPrivateKey: CryptoKey;
let fakeJwks: { keys: JWK[] };
let jwksRequestCounter = 0;
let fetchSpy: any = null;

export async function setupClerkTest({ jwksUrl }: { jwksUrl?: string }) {
	const { publicKey, privateKey } = await generateKeyPair("RS256");

	testPrivateKey = privateKey;

	const jwk = await exportJWK(publicKey);

	fakeJwks = {
		keys: [
			{
				...jwk,
				kid: "mw_test_key",
				alg: "RS256",
				use: "sig",
			},
		],
	};

	const originalFetch = globalThis.fetch;

	if (fetchSpy) fetchSpy.mockRestore();

	fetchSpy = spyOn(globalThis, "fetch").mockImplementation((async (
		input: any,
		init: any,
	) => {
		const url = input instanceof Request ? input.url : input.toString();

		if (url.includes("/jwks") || (jwksUrl && url === jwksUrl)) {
			jwksRequestCounter++;

			return new Response(JSON.stringify(fakeJwks), {
				headers: { "Content-Type": "application/json" },
			});
		}

		return originalFetch(input, init);
	}) as any);
}

export async function generateClerkToken(
	config: { issuer: string; exp?: number },
	payload: {
		sub: string;
		sid: string;
		userId?: string | null;
	},
) {
	return new SignJWT({ ...payload, userId: payload.userId ?? null })
		.setProtectedHeader({
			alg: "RS256",
			kid: "mw_test_key",
		})
		.setIssuer(config.issuer)
		.setIssuedAt()
		.setExpirationTime(config.exp ?? "1h")
		.sign(testPrivateKey);
}

export function resetJwksCounter() {
	jwksRequestCounter = 0;
}

export function getJwksRequestCount() {
	return jwksRequestCounter;
}

export const createMockClerkUser = (
	overrides?: Partial<ClerkUser>,
): ClerkUser => ({
	id: "user_29w83x498234",
	first_name: "Jane",
	last_name: "Doe",
	image_url: "https://img.clerk.com/preview.png",
	email_addresses: [
		{
			id: "idn_12345",
			email_address: "jane.doe@example.com",
		},
	],
	external_accounts: [],
	...overrides,
});
