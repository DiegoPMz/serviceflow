/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	spyOn,
	test,
} from "bun:test";
import { Elysia } from "elysia";
import { clerkTokenVerifier } from "../auth";
import {
	type ClerkUser,
	clerkIdentityProvider,
} from "../auth/clerk-identity-provider";
import { clerkConfig } from "../config";
import { ErrorDetailsException } from "../result";
import {
	createMockClerkUser,
	generateClerkToken,
	getJwksRequestCount,
	resetJwksCounter,
	setupClerkTest,
} from "../tests";
import { createAuthPlugin } from "./auth-plugin";

const authPlugin = createAuthPlugin({
	tokenVerifier: clerkTokenVerifier,
	userIdentityProvider: clerkIdentityProvider,
});

describe("Auth-Plugin integration/E2E Tests", () => {
	const app = new Elysia().use(authPlugin).get(
		"/protected-route",
		({ auth, status }) => {
			return status(200, {
				success: true,
				externalId: auth.externalId,
				sessionId: auth.sessionId,
			});
		},
		{
			auth: true,
		},
	);

	beforeAll(async () => {
		await setupClerkTest({
			jwksUrl: clerkConfig.jwksUrl,
		});
	});

	beforeEach(() => {
		resetJwksCounter();
	});

	test("should allow access to the endpoint, inject user details, and leverage JWKS caching", async () => {
		const token1 = await generateClerkToken(clerkConfig, {
			sub: "clerk_user_99",
			sid: "session_abc",
		});

		const response1 = await app.handle(
			new Request("http://localhost/protected-route", {
				headers: { Authorization: `Bearer ${token1}` },
			}),
		);

		expect(response1.status).toBe(200);
		const body1 = await response1.json();
		expect(body1).toEqual({
			success: true,
			externalId: "clerk_user_99",
			sessionId: "session_abc",
		});

		const token2 = await generateClerkToken(clerkConfig, {
			sub: "clerk_user_100",
			sid: "session_xyz",
		});

		const response2 = await app.handle(
			new Request("http://localhost/protected-route", {
				headers: { Authorization: `Bearer ${token2}` },
			}),
		);

		expect(response2.status).toBe(200);
		expect(getJwksRequestCount()).toBe(1);
	});

	test("should return 401 Unauthorized when the Authorization header is missing", async () => {
		const response = await app.handle(
			new Request("http://localhost/protected-route", { method: "GET" }),
		);

		expect(response.status).toBe(401);
	});

	test("should return 401 Unauthorized when the provided token has an invalid signature", async () => {
		const validToken = await generateClerkToken(clerkConfig, {
			sub: "user_test",
			sid: "session_test",
		});

		const tamperedToken = `${validToken} manipulated`;

		const response = await app.handle(
			new Request("http://localhost/protected-route", {
				headers: { Authorization: `Bearer ${tamperedToken}` },
			}),
		);

		expect(response.status).toBe(401);
	});

	test("should return 401 when the JWT token has expired (exp claim)", async () => {
		const expiredToken = await generateClerkToken(
			{ ...clerkConfig, exp: Math.floor(Date.now() / 1000) - 3600 },
			{
				sub: "user_test",
				sid: "session_test",
			},
		);

		const response = await app.handle(
			new Request("http://localhost/protected-route", {
				headers: { Authorization: `Bearer ${expiredToken}` },
			}),
		);

		expect(response.status).toBe(401);
	});

	test("should return 401 when required claims (sub or sid) are missing from token payload", async () => {
		const tokenWithoutSession = await generateClerkToken(clerkConfig, {
			sub: "user_test",
			sid: undefined as unknown as string,
		});

		const response = await app.handle(
			new Request("http://localhost/protected-route", {
				headers: { Authorization: `Bearer ${tokenWithoutSession}` },
			}),
		);

		expect(response.status).toBe(401);
	});
});

describe("Auth-Plugin -> UserDetails() integration/E2E Tests", () => {
	const app = new Elysia()
		// Just for testing purposes
		.onError(({ error }) => {
			throw error;
		})
		.use(authPlugin)
		.get(
			"/user-details",
			async ({ auth, status }) => {
				const userDetails = await auth.userDetails();

				return status(200, {
					success: true,
					user: userDetails,
				});
			},
			{ auth: true },
		);

	let fetchSpy: any = null;
	const originalFetch = globalThis.fetch;

	afterEach(() => {
		if (fetchSpy) fetchSpy.mockRestore();
		globalThis.fetch = originalFetch;
	});

	function mockClerkResponse(
		externalId: string,
		responseOverrides?: Partial<ClerkUser>,
	) {
		if (fetchSpy) fetchSpy.mockRestore();

		fetchSpy = spyOn(globalThis, "fetch").mockImplementation((async (
			input: any,
			init: any,
		) => {
			const url = input instanceof Request ? input.url : input.toString();

			if (url.includes(`https://api.clerk.com/v1/users/${externalId}`)) {
				const mockUser = createMockClerkUser({
					id: externalId,
					...responseOverrides,
				});

				return new Response(JSON.stringify(mockUser), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}

			return originalFetch(input, init);
		}) as any);
	}

	test("should return user details when identity provider succeeds", async () => {
		const externalId = "user_123";
		const sessionId = "session_123";

		const token = await generateClerkToken(clerkConfig, {
			sub: externalId,
			sid: sessionId,
		});

		mockClerkResponse(externalId, {
			email_addresses: [{ id: "email_1", email_address: "john@example.com" }],
		});

		const response = await app.handle(
			new Request("http://localhost/user-details", {
				headers: { Authorization: `Bearer ${token}` },
			}),
		);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.user.emailAddress).toBe("john@example.com");
	});

	test("should throw ErrorDetailsException when identity provider returns incomplete data", async () => {
		const externalId = "user_incomplete";

		const token = await generateClerkToken(clerkConfig, {
			sub: externalId,
			sid: "session_123",
		});

		mockClerkResponse(externalId, {
			first_name: null,
			email_addresses: [],
		});

		expect(
			app.handle(
				new Request("http://localhost/user-details", {
					headers: { Authorization: `Bearer ${token}` },
				}),
			),
		).rejects.toThrowError(ErrorDetailsException);
	});
});
