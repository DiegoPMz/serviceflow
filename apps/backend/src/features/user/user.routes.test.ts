/** biome-ignore-all lint/suspicious/noExplicitAny: <Just for testing porpuses> */

import { beforeEach, describe, expect, mock, test } from "bun:test";
import Elysia from "elysia";
import { UserErrors } from "./common/user.errors";
import { User } from "./common/user.model";
import { type UserDependencies, userRoutes } from "./index";

const mockUserId = "01H8X5Y9Z0123456789ABCDEF1";

const mockAuthPlugin = new Elysia({ name: "mock-auth" }).derive(
	{ as: "global" },
	() => ({
		auth: {
			userId: mockUserId,
		},
	}),
);

describe("User HTTP Routes - Unit Tests", () => {
	let mockDeps: UserDependencies;

	beforeEach(() => {
		mock.restore();

		mockDeps = {
			userRepository: {
				getById: mock(() => Promise.resolve(null)),
			} as any,
		};
	});

	const createTestApp = () =>
		new Elysia().use(userRoutes(mockAuthPlugin as any, mockDeps));

	// =========================================================================
	// 1. GET /v1/users/me
	// =========================================================================
	describe("GET /v1/users/me", () => {
		test("should return 200 with the user data when the user exists", async () => {
			const userResult = User.create({
				externalId: "auth0-abc123",
				email: "juan@example.com",
				name: "Juan",
				lastName: "Pérez",
				pictureUrl: "https://example.com/photo.jpg",
			});
			const user = userResult.value;

			mockDeps.userRepository.getById = mock(() => Promise.resolve(user));

			const app = createTestApp();
			const response = await app.handle(
				new Request("http://localhost/v1/users/me", {
					method: "GET",
				}),
			);

			expect(mockDeps.userRepository.getById).toHaveBeenCalledWith(mockUserId);
			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body.success).toBe(true);
			expect(body.data).toEqual({
				id: user.id,
				email: user.email,
				name: user.name,
				lastName: user.lastName,
				pictureUrl: user.pictureUrl,
			});
		});

		test("should return 404 when the user is not found", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request("http://localhost/v1/users/me", {
					method: "GET",
				}),
			);

			expect(mockDeps.userRepository.getById).toHaveBeenCalledWith(mockUserId);
			expect(response.status).toBe(UserErrors.USER_NOT_FOUND.statusCode);

			const body = await response.json();
			expect(body.success).toBe(false);
			expect(body.error.code).toBe(UserErrors.USER_NOT_FOUND.code);
		});

		test("should propagate the authenticated userId to the repository", async () => {
			const app = createTestApp();

			await app.handle(
				new Request("http://localhost/v1/users/me", {
					method: "GET",
				}),
			);

			expect(mockDeps.userRepository.getById).toHaveBeenCalledWith(mockUserId);
		});
	});
});
