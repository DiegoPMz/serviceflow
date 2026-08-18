/** biome-ignore-all lint/suspicious/noExplicitAny: <Just for testing porpuses> */

import { beforeEach, describe, expect, mock, test } from "bun:test";
import { Result } from "@serviceflow/backend/shared/result";
import Elysia from "elysia";
import { workspaceMemberErrors } from "../workspace/common/workspace-member.errors";
import {
	WORKSPACE_ROLES,
	type WorkspaceMember,
} from "../workspace/common/workspace-member.model";
import { type ClientDependencies, clientRoutes } from "./index";

const mockUserId = "01H8X5Y9Z0123456789ABCDEF1";

const mockAuthPlugin = new Elysia({ name: "mock-auth" }).derive(
	{ as: "global" },
	() => ({
		auth: {
			userId: mockUserId,
		},
	}),
);

const validWorkspaceId = "01H8X5Y9Z0123456789ABCDEF2";

const validBody = {
	name: "Juan Pérez",
	email: "juan@example.com",
	phoneNumber: "+5215551234567",
	location: "CDMX",
};

describe("Client HTTP Routes - Unit Tests", () => {
	let mockDeps: ClientDependencies;

	beforeEach(() => {
		mock.restore();

		mockDeps = {
			clientRepository: {
				clientExists: mock(() => Promise.resolve(false)),
				save: mock(() => Promise.resolve()),
				getAllPaginated: mock(() =>
					Promise.resolve({ items: [], cursor: null, hasNextPage: false }),
				),
			} as any,
			workspaceAuthorization: {
				excecute: mock(() => Promise.resolve(Result.success(true))),
			} as any,
		};
	});

	const createTestApp = () =>
		new Elysia().use(clientRoutes(mockAuthPlugin as any, mockDeps));

	// =========================================================================
	// 1. POST /v1/workspaces/:workspaceId/clients
	// =========================================================================
	describe("POST /v1/workspaces/:workspaceId/clients", () => {
		test("should return 422 when the request body is invalid (e.g., empty name)", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/clients`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							...validBody,
							name: "",
						}),
					},
				),
			);

			expect(response.status).toBe(422);
		});

		test("should return 422 when the workspaceId param is invalid", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request("http://localhost/v1/workspaces/not-a-valid-id/clients", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(validBody),
				}),
			);

			expect(response.status).toBe(422);
		});

		test("should return 403 if user lacks required roles (e.g., viewer trying to create a client)", async () => {
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
					`http://localhost/v1/workspaces/${validWorkspaceId}/clients`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(validBody),
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
				],
			});

			expect(response.status).toBe(403);
		});

		test("should return 409 when the client already exists", async () => {
			mockDeps.clientRepository.clientExists = mock(() =>
				Promise.resolve(true),
			);

			const app = createTestApp();
			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/clients`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(validBody),
					},
				),
			);

			expect(response.status).toBe(409);

			const body = await response.json();
			expect(body.success).toBe(false);
		});

		test("should return 201 Created when the client is successfully registered", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/clients`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(validBody),
					},
				),
			);

			expect(response.status).toBe(201);

			const body = await response.json();
			expect(body.success).toBe(true);
		});
	});

	// =========================================================================
	// 2. GET /v1/workspaces/:workspaceId/clients
	// =========================================================================
	describe("GET /v1/workspaces/:workspaceId/clients", () => {
		test("should return 422 when query parameters are invalid (e.g., limit > 100)", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/clients?limit=500`,
					{
						method: "GET",
					},
				),
			);

			expect(response.status).toBe(422);
		});

		test("should return 403 if the user is not a member of the workspace", async () => {
			mockDeps.workspaceAuthorization.excecute = mock(() =>
				Promise.resolve(
					Result.failure<WorkspaceMember>(workspaceMemberErrors.NOT_A_MEMBER),
				),
			);

			const app = createTestApp();
			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/clients`,
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

			expect(response.status).toBe(
				workspaceMemberErrors.NOT_A_MEMBER.statusCode,
			);
		});

		test("should return 200 with the paginated clients", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/clients`,
					{
						method: "GET",
					},
				),
			);

			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body.success).toBe(true);
			expect(body.data).toEqual({
				items: [],
				cursor: null,
				hasNextPage: false,
			});
		});
	});
});
