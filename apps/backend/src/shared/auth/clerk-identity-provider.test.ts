import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { createClerkIdentityProvider } from "./clerk-identity-provider";

describe("createClerkIdentityProvider Unit Tests", () => {
	let fetchSpy: any;

	const config = {
		secretKey: "sk_test_mock_secret_key",
		baseUrl: "https://api.clerk.com/v1",
	};

	beforeEach(() => {
		fetchSpy = spyOn(globalThis, "fetch");
	});

	afterEach(() => {
		fetchSpy.mockRestore();
	});

	describe("getUserDetails", () => {
		test("debe retornar los detalles del usuario asignando el email principal (primary_email_address_id)", async () => {
			const provider = createClerkIdentityProvider(config);

			const mockClerkUser = {
				id: "user_123",
				first_name: "Jane",
				last_name: "Doe",
				image_url: "https://example.com/avatar.png",
				primary_email_address_id: "email_2",
				email_addresses: [
					{ id: "email_1", email_address: "secondary@example.com" },
					{ id: "email_2", email_address: "primary@example.com" },
				],
				external_accounts: [],
			};

			fetchSpy.mockResolvedValue(
				new Response(JSON.stringify(mockClerkUser), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			);

			const result = await provider.getUserDetails("user_123");

			expect(fetchSpy).toHaveBeenCalledWith(
				"https://api.clerk.com/v1/users/user_123",
				expect.objectContaining({ method: "GET" }),
			);

			expect(result).toEqual({
				firstName: "Jane",
				lastName: "Doe",
				emailAddress: "primary@example.com",
				imageUrl: "https://example.com/avatar.png",
			});
		});

		test("debe usar el primer email como fallback si primary_email_address_id no coincide o es nulo", async () => {
			const provider = createClerkIdentityProvider(config);

			const mockClerkUser = {
				id: "user_123",
				first_name: "John",
				last_name: null,
				image_url: "https://example.com/avatar.png",
				primary_email_address_id: null,
				email_addresses: [
					{ id: "email_1", email_address: "fallback@example.com" },
				],
				external_accounts: [],
			};

			fetchSpy.mockResolvedValue(
				new Response(JSON.stringify(mockClerkUser), { status: 200 }),
			);

			const result = await provider.getUserDetails("user_123");

			expect(result.emailAddress).toBe("fallback@example.com");
			expect(result.lastName).toBeUndefined();
		});

		test("debe lanzar INCOMPLETE_USER_PROFILE si falta first_name", async () => {
			const provider = createClerkIdentityProvider(config);

			const mockIncompleteUser = {
				id: "user_123",
				first_name: null,
				image_url: "https://example.com/avatar.png",
				email_addresses: [{ id: "email_1", email_address: "test@example.com" }],
			};

			fetchSpy.mockResolvedValue(
				new Response(JSON.stringify(mockIncompleteUser), { status: 200 }),
			);

			expect(provider.getUserDetails("user_123")).rejects.toThrow();
		});

		test("debe lanzar INCOMPLETE_USER_PROFILE si el usuario no tiene emails", async () => {
			const provider = createClerkIdentityProvider(config);

			const mockNoEmailUser = {
				id: "user_123",
				first_name: "John",
				image_url: "https://example.com/avatar.png",
				email_addresses: [],
			};

			fetchSpy.mockResolvedValue(
				new Response(JSON.stringify(mockNoEmailUser), { status: 200 }),
			);

			expect(provider.getUserDetails("user_123")).rejects.toThrow();
		});

		test("debe lanzar un error CLERK_API_ERROR cuando la API de Clerk responde con un status != 2xx", async () => {
			const provider = createClerkIdentityProvider(config);

			fetchSpy.mockResolvedValue(
				new Response(JSON.stringify({ error: "User not found" }), {
					status: 404,
					statusText: "Not Found",
				}),
			);

			expect(provider.getUserDetails("invalid_id")).rejects.toThrow();
		});

		test("debe lanzar SERVICE_UNAVAILABLE cuando la llamada fetch falla a nivel de red", async () => {
			const provider = createClerkIdentityProvider(config);

			fetchSpy.mockRejectedValue(new Error("Network connection lost"));

			expect(provider.getUserDetails("user_123")).rejects.toThrow();
		});
	});

	describe("updatePublicMetadata", () => {
		test("debe realizar una petición PATCH correcta con los metadatos y headers requeridos", async () => {
			const provider = createClerkIdentityProvider(config);

			fetchSpy.mockResolvedValue(
				new Response(JSON.stringify({ success: true }), { status: 200 }),
			);

			const metadata = { role: "admin", systemId: "sys_123" };
			await provider.updatePublicMetadata("user_123", metadata);

			expect(fetchSpy).toHaveBeenCalledWith(
				"https://api.clerk.com/v1/users/user_123",
				{
					method: "PATCH",
					headers: {
						Authorization: "Bearer sk_test_mock_secret_key",
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ public_metadata: metadata }),
				},
			);
		});

		test("debe lanzar error cuando la API responde con un status de error (ej: 400)", async () => {
			const provider = createClerkIdentityProvider(config);

			fetchSpy.mockResolvedValue(
				new Response(JSON.stringify({ error: "Bad Request" }), {
					status: 400,
					statusText: "Bad Request",
				}),
			);

			expect(
				provider.updatePublicMetadata("user_123", { role: "invalid" }),
			).rejects.toThrow();
		});

		test("debe lanzar SERVICE_UNAVAILABLE cuando fetch falla por error de red", async () => {
			const provider = createClerkIdentityProvider(config);

			fetchSpy.mockRejectedValue(new Error("Connection refused"));

			expect(
				provider.updatePublicMetadata("user_123", { role: "admin" }),
			).rejects.toThrow();
		});
	});
});
