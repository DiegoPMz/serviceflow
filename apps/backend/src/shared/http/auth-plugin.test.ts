import { beforeAll, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { Elysia } from "elysia";
import { ulid } from "ulidx";
import { clerkTokenVerifier } from "../auth";
import {
	type ClerkUser,
	clerkIdentityProvider,
} from "../auth/clerk-identity-provider";
import { clerkConfig } from "../config";
import {
	createInMemoryUserBus,
	createMockClerkUser,
	generateClerkToken,
	getJwksRequestCount,
	resetJwksCounter,
	setupClerkTest,
} from "../tests";
import { createAuthPlugin } from "./auth-plugin";

const userBus = createInMemoryUserBus();

const authPlugin = createAuthPlugin({
	tokenVerifier: clerkTokenVerifier,
	userIdentityProvider: clerkIdentityProvider,
	userBus: userBus,
});

let fetchSpy: any = null;

describe("Auth-Plugin integration/E2E Tests", () => {
	const app = new Elysia().use(authPlugin).get(
		"/protected-route",
		({ auth, status }) => {
			return status(200, {
				success: true,
				externalId: auth.externalId,
				userId: auth.userId,
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
		if (fetchSpy) fetchSpy.mockRestore();

		resetJwksCounter();
	});

	test("should allow access using existing userId in JWT (Fast Path) and provision new user when missing (JIT Path)", async () => {
		const existingUserId = ulid();

		const token1 = await generateClerkToken(clerkConfig, {
			sub: "clerk_user_99",
			sid: "session_abc",
			userId: existingUserId,
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
			userId: existingUserId,
		});

		const externalId = "clerk_user_100";

		mockClerkResponse(externalId, {
			email_addresses: [{ id: "email_1", email_address: "john@example.com" }],
		});

		const token2 = await generateClerkToken(clerkConfig, {
			sub: externalId,
			sid: "session_xyz",
			userId: undefined,
		});

		const response2 = await app.handle(
			new Request("http://localhost/protected-route", {
				headers: { Authorization: `Bearer ${token2}` },
			}),
		);

		expect(response2.status).toBe(200);
		const body2 = await response2.json();
		expect(body2).toEqual({
			success: true,
			externalId: "clerk_user_100",
			userId: expect.any(String),
		});

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
			userId: ulid(),
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
				userId: ulid(),
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
			userId: ulid(),
		});

		const response = await app.handle(
			new Request("http://localhost/protected-route", {
				headers: { Authorization: `Bearer ${tokenWithoutSession}` },
			}),
		);

		expect(response.status).toBe(401);
	});
});

const originalFetch = globalThis.fetch;

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

		if (url.includes(`https://api.clerk.com/v1/users/`)) {
			console.log("se ejecuto el fetch de USER_DETAILS");
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
