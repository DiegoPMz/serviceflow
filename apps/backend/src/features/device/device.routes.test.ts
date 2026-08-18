/** biome-ignore-all lint/suspicious/noExplicitAny: <Just for testing porpuses> */

import { beforeEach, describe, expect, mock, test } from "bun:test";
import { Result } from "@serviceflow/backend/shared/result";
import Elysia from "elysia";
import { workspaceMemberErrors } from "../workspace/common/workspace-member.errors";
import {
	WORKSPACE_ROLES,
	type WorkspaceMember,
} from "../workspace/common/workspace-member.model";
import { type DeviceDependencies, deviceRoutes } from "./index";

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
	clientId: "01H8X5Y9Z0123456789ABCDEF3",
	serialNumber: "SN-ABC123",
	brand: "Samsung",
	model: "Galaxy S21",
	components: [{ name: "Batería", partNumber: "BAT-001", type: "supply" }],
};

describe("Device HTTP Routes - Unit Tests", () => {
	let mockDeps: DeviceDependencies;

	beforeEach(() => {
		mock.restore();

		mockDeps = {
			deviceRepository: {
				exists: mock(() => Promise.resolve(false)),
				save: mock(() => Promise.resolve()),
				getByIds: mock(() => Promise.resolve(null)),
				getAllPaginated: mock(() =>
					Promise.resolve({ items: [], cursor: null, hasNextPage: false }),
				),
				getDeviceComponentsPaginated: mock(() =>
					Promise.resolve({ items: [], cursor: null, hasNextPage: false }),
				),
				transaction: mock((fn: (repo: any) => Promise<unknown>) =>
					fn(mockDeps.deviceRepository),
				),
			} as any,
			workspaceAuthorization: {
				excecute: mock(() => Promise.resolve(Result.success(true))),
			} as any,
		};
	});

	const createTestApp = () =>
		new Elysia().use(deviceRoutes(mockAuthPlugin as any, mockDeps));

	// =========================================================================
	// 1. POST /v1/workspaces/:workspaceId/devices
	// =========================================================================
	describe("POST /v1/workspaces/:workspaceId/devices", () => {
		test("should return 422 when the request body is invalid (e.g., empty brand)", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/devices`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							...validBody,
							brand: "",
						}),
					},
				),
			);

			expect(response.status).toBe(422);
		});

		test("should return 422 when a component is invalid (e.g., empty name)", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/devices`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							...validBody,
							components: [{ name: "", partNumber: "BAT-001", type: "supply" }],
						}),
					},
				),
			);

			expect(response.status).toBe(422);
		});

		test("should return 422 when the workspaceId param is invalid", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request("http://localhost/v1/workspaces/not-a-valid-id/devices", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(validBody),
				}),
			);

			expect(response.status).toBe(422);
		});

		test("should return 403 if user lacks required roles (e.g., viewer trying to register a device)", async () => {
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
					`http://localhost/v1/workspaces/${validWorkspaceId}/devices`,
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

		test("should return 409 when the device already exists", async () => {
			mockDeps.deviceRepository.exists = mock(() => Promise.resolve(true));

			const app = createTestApp();
			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/devices`,
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

		test("should return 201 Created when the device is successfully registered", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/devices`,
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
	// 2. GET /v1/workspaces/:workspaceId/devices
	// =========================================================================
	describe("GET /v1/workspaces/:workspaceId/devices", () => {
		test("should return 422 when query parameters are invalid (e.g., limit > 100)", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/devices?limit=500`,
					{
						method: "GET",
					},
				),
			);

			expect(response.status).toBe(422);
		});

		test("should return 422 when clientId query param is malformed", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/devices?clientId=bad-id`,
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
					`http://localhost/v1/workspaces/${validWorkspaceId}/devices`,
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

		test("should return 200 with the paginated devices", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/devices`,
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

	// =========================================================================
	// 3. GET /v1/workspaces/:workspaceId/devices/:deviceId/components
	// =========================================================================
	describe("GET /v1/workspaces/:workspaceId/devices/:deviceId/components", () => {
		const validDeviceId = "01H8X5Y9Z0123456789ABCDEF7";
		const componentsUrl = `http://localhost/v1/workspaces/${validWorkspaceId}/devices/${validDeviceId}/components`;

		test("should return 422 when the deviceId param is invalid", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/devices/not-a-valid-id/components`,
					{
						method: "GET",
					},
				),
			);

			expect(response.status).toBe(422);
		});

		test("should return 422 when query parameters are invalid (e.g., limit > 100)", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request(`${componentsUrl}?limit=500`, {
					method: "GET",
				}),
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
				new Request(componentsUrl, {
					method: "GET",
				}),
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

		test("should return 404 when the device does not exist", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request(componentsUrl, {
					method: "GET",
				}),
			);

			expect(response.status).toBe(404);

			const body = await response.json();
			expect(body.success).toBe(false);
			expect(
				mockDeps.deviceRepository.getDeviceComponentsPaginated,
			).not.toHaveBeenCalled();
		});

		test("should return 200 with the paginated components and forward query params", async () => {
			mockDeps.deviceRepository.getByIds = mock(() =>
				Promise.resolve({ id: validDeviceId } as any),
			);
			mockDeps.deviceRepository.getDeviceComponentsPaginated = mock(() =>
				Promise.resolve({
					items: [
						{
							id: "01H8X5Y9Z0123456789ABCDEF8",
							name: "Batería",
							partNumber: "BAT-001",
							type: "supply" as const,
						},
					],
					cursor: null,
					hasNextPage: false,
				}),
			);

			const app = createTestApp();
			const response = await app.handle(
				new Request(
					`${componentsUrl}?limit=5&orderBy=name&direction=asc&search=BAT`,
					{
						method: "GET",
					},
				),
			);

			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body.success).toBe(true);
			expect(body.data.items).toHaveLength(1);
			expect(body.data.items[0]).toEqual({
				id: "01H8X5Y9Z0123456789ABCDEF8",
				name: "Batería",
				partNumber: "BAT-001",
				type: "supply",
			});

			expect(
				mockDeps.deviceRepository.getDeviceComponentsPaginated,
			).toHaveBeenCalledWith({
				limit: 5,
				cursor: undefined,
				orderBy: "name",
				direction: "asc",
				search: "BAT",
				deviceId: validDeviceId,
				workspaceId: validWorkspaceId,
			});
		});
	});
});
