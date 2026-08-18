/** biome-ignore-all lint/suspicious/noExplicitAny: <Just for testing porpuses> */

import { beforeEach, describe, expect, mock, test } from "bun:test";
import { Result } from "@serviceflow/backend/shared/result";
import Elysia from "elysia";
import { workspaceMemberErrors } from "../workspace/common/workspace-member.errors";
import {
	WORKSPACE_ROLES,
	type WorkspaceMember,
} from "../workspace/common/workspace-member.model";
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
				getAllPaginated: mock(() =>
					Promise.resolve({
						items: [],
						cursor: null,
						hasNextPage: false,
					}),
				),
			} as any,
			workspaceAuthorization: {
				excecute: mock(() => Promise.resolve(Result.success(true))),
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

	// =========================================================================
	// 2. GET /v1/workspaces/:workspaceId/users
	// =========================================================================
	describe("GET /v1/workspaces/:workspaceId/users", () => {
		const validWorkspaceId = "01H8X5Y9Z0123456789ABCDEF2";

		test("should return 200 with the paginated users when authorized", async () => {
			const pagination = {
				items: [
					{
						id: "01H8X5Y9Z0123456789ABCDEF3",
						email: "juan@example.com",
						name: "Juan",
						lastName: "Perez",
						pictureUrl: null,
						phone: null,
					},
				],
				cursor: null,
				hasNextPage: false,
			};

			mockDeps.userRepository.getAllPaginated = mock(() =>
				Promise.resolve(pagination),
			);

			const app = createTestApp();
			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/users`,
					{
						method: "GET",
					},
				),
			);

			expect(mockDeps.workspaceAuthorization.excecute).toHaveBeenCalledWith({
				workspaceId: validWorkspaceId,
				userId: mockUserId,
				requiredRoles: [
					WORKSPACE_ROLES.OWNER,
					WORKSPACE_ROLES.ADMIN,
					WORKSPACE_ROLES.TECHNICIAN,
					WORKSPACE_ROLES.VIEWER,
				],
			});

			expect(mockDeps.userRepository.getAllPaginated).toHaveBeenCalledWith({
				limit: 20,
				cursor: undefined,
				orderBy: "createdAt",
				direction: "desc",
				search: undefined,
				workspaceId: validWorkspaceId,
			});

			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body.success).toBe(true);
			expect(body.data).toEqual(pagination);
		});

		test("should return 404 when the user is not a member of the workspace", async () => {
			mockDeps.workspaceAuthorization.excecute = mock(() =>
				Promise.resolve(
					Result.failure<WorkspaceMember>(workspaceMemberErrors.NOT_A_MEMBER),
				),
			);

			const app = createTestApp();
			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/users`,
					{
						method: "GET",
					},
				),
			);

			expect(response.status).toBe(
				workspaceMemberErrors.NOT_A_MEMBER.statusCode,
			);

			const body = await response.json();
			expect(body.success).toBe(false);
			expect(body.error.code).toBe(workspaceMemberErrors.NOT_A_MEMBER.code);
		});

		test("should return 403 when the user lacks the required roles", async () => {
			mockDeps.workspaceAuthorization.excecute = mock(() =>
				Promise.resolve(
					Result.failure<WorkspaceMember>(
						workspaceMemberErrors.INSUFFICIENT_PERMISSIONS,
					),
				),
			);

			const app = createTestApp();
			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/users`,
					{
						method: "GET",
					},
				),
			);

			expect(response.status).toBe(
				workspaceMemberErrors.INSUFFICIENT_PERMISSIONS.statusCode,
			);
		});

		test("should return 422 when query parameters are invalid (e.g., limit > 100)", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/users?limit=500`,
					{
						method: "GET",
					},
				),
			);

			expect(response.status).toBe(422);
		});

		test("should propagate query parameters to the repository", async () => {
			const app = createTestApp();

			await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/users?limit=5&orderBy=name&direction=asc&search=juan`,
					{
						method: "GET",
					},
				),
			);

			expect(mockDeps.userRepository.getAllPaginated).toHaveBeenCalledWith({
				limit: 5,
				cursor: undefined,
				orderBy: "name",
				direction: "asc",
				search: "juan",
				workspaceId: validWorkspaceId,
			});
		});
	});
});
