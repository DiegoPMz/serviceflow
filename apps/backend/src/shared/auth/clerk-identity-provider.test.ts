import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { ErrorDetailsException } from "../result";
import { createMockClerkUser } from "../tests";
import { AuthErrors } from "./auth.errors";
import { clerkIdentityProvider } from "./clerk-identity-provider";

describe("Clerk Identity Provider Unit Tests", () => {
	let fetchSpy: any = null;
	const originalFetch = globalThis.fetch;

	afterEach(() => {
		if (fetchSpy) fetchSpy.mockRestore();
		globalThis.fetch = originalFetch;
	});

	test("should return AuthUserDetails when Clerk responds successfully", async () => {
		const externalId = "user_success";

		fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(
				JSON.stringify(
					createMockClerkUser({
						id: externalId,
						first_name: "Bruce",
						last_name: "Wayne",
						email_addresses: [{ id: "em_1", email_address: "bruce@wayne.com" }],
					}),
				),
				{ status: 200 },
			),
		);

		const userDetails = await clerkIdentityProvider.getUserDetails(externalId);

		expect(userDetails).toEqual({
			firstName: "Bruce",
			lastName: "Wayne",
			emailAddress: "bruce@wayne.com",
			imageUrl: "https://img.clerk.com/preview.png",
		});
	});

	test("should throw INCOMPLETE_USER_PROFILE when first_name is missing", async () => {
		const externalId = "user_no_name";

		fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(
				JSON.stringify(
					createMockClerkUser({
						first_name: null,
					}),
				),
				{ status: 200 },
			),
		);

		try {
			await clerkIdentityProvider.getUserDetails(externalId);
		} catch (error: unknown) {
			expect((error as ErrorDetailsException)?.errorDetails.code).toBe(
				AuthErrors.INCOMPLETE_USER_PROFILE.code,
			);
		}
	});

	test("should throw SERVICE_UNAVAILABLE when fetch completely fails (Network Error)", async () => {
		const externalId = "user_network_error";

		fetchSpy = spyOn(globalThis, "fetch").mockRejectedValue(
			new TypeError("Failed to fetch"),
		);

		try {
			await clerkIdentityProvider.getUserDetails(externalId);
		} catch (error: unknown) {
			const err = error as ErrorDetailsException;

			expect(err).toBeInstanceOf(ErrorDetailsException);
			expect(err?.errorDetails.code).toBe(AuthErrors.SERVICE_UNAVAILABLE.code);
			expect(err?.cause).toBeInstanceOf(TypeError);
		}
	});

	test("should throw CLERK_API_ERROR when Clerk responds with 4xx or 5xx", async () => {
		const externalId = "user_api_error";

		fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(
				JSON.stringify({
					errors: [{ message: "Rate limit exceeded" }],
				}),
				{ status: 429 },
			),
		);

		try {
			await clerkIdentityProvider.getUserDetails(externalId);
		} catch (error: unknown) {
			const err = error as ErrorDetailsException;

			expect(err).toBeInstanceOf(ErrorDetailsException);
			expect(err?.errorDetails.code).toBe("CLERK_API_ERROR");
			expect(err?.errorDetails.statusCode).toBe(502);
		}
	});
});
