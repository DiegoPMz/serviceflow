/** biome-ignore-all lint/suspicious/noExplicitAny: <Just for testing porpuses> */

import { beforeEach, describe, expect, mock, test } from "bun:test";
import { Result } from "@serviceflow/backend/shared/result";
import Elysia from "elysia";
import { workspaceMemberErrors } from "../workspace/common/workspace-member.errors";
import {
	WORKSPACE_ROLES,
	type WorkspaceRole,
} from "../workspace/common/workspace-member.model";
import { Order } from "./common/order.model";
import { type OrderDependencies, orderRoutes } from "./index";

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
const validOrderId = "01H8X5Y9Z0123456789ABCDEF6";

const ONE_PIXEL_PNG =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

const validCreateBody = {
	clientId: "01H8X5Y9Z0123456789ABCDEF3",
	deviceId: "01H8X5Y9Z0123456789ABCDEF4",
	observations: "Pantalla rota",
	components: [{ id: "01H8X5Y9Z0123456789ABCDEF5", quantity: 1 }],
};

const validGenerateDocumentBody = {
	deviceImageBase64: ONE_PIXEL_PNG,
	clientSignatureBase64: ONE_PIXEL_PNG,
};

const buildOrder = (
	overrides: Partial<Parameters<typeof Order.reconstitute>[0]> = {},
) =>
	Order.reconstitute({
		id: validOrderId,
		clientId: validCreateBody.clientId,
		deviceId: validCreateBody.deviceId,
		userId: mockUserId,
		workspaceId: validWorkspaceId,
		observations: "Pantalla rota",
		folio: "TEST1",
		clientNameSnapshot: "Juan Pérez",
		clientEmailSnapshot: "juan@example.com",
		clientPhoneSnapshot: "+5215551234567",
		clientLocationSnapshot: "CDMX",
		deviceBrandSnapshot: "Samsung",
		deviceModelSnapshot: "Galaxy S21",
		deviceSerialNumberSnapshot: "SN-ABC123",
		orderComponents: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		documentKey: null,
		userNameSnapshot: "Juan Pérez",
		...overrides,
	});

const buildWorkspace = () => ({
	id: validWorkspaceId,
	prefix: "TEST",
	orderCount: 0,
	company: { logoKey: null } as any,
	increaseCount: mock(() => undefined),
});

describe("Order HTTP Routes - Unit Tests", () => {
	let mockDeps: OrderDependencies;
	let mockWorkspace: ReturnType<typeof buildWorkspace>;

	beforeEach(() => {
		mock.restore();
		mockWorkspace = buildWorkspace();

		mockDeps = {
			orderRepository: {
				save: mock(() => Promise.resolve()),
				getById: mock(() => Promise.resolve(null)),
				update: mock(() => Promise.resolve()),
			} as any,
			clientRepository: {
				getByIds: mock(() => Promise.resolve(null)),
			} as any,
			deviceRepository: {
				getByIds: mock(() => Promise.resolve(null)),
			} as any,
			workspaceRepository: {
				getById: mock(() => Promise.resolve(mockWorkspace)),
				update: mock(() => Promise.resolve()),
			} as any,
			userRepository: {
				getById: mock(() =>
					Promise.resolve({ name: "Juan", lastName: "Pérez" }),
				),
			} as any,
			pdfGenerator: {
				generate: mock(() => Promise.resolve(new Uint8Array([1, 2, 3]))),
			} as any,
			storageService: {
				upload: mock(() => Promise.resolve(Result.success("key"))),
				getFileBase64: mock(() => Promise.resolve("")),
				createSignedDownloadUrl: mock(() =>
					Promise.resolve("https://cdn.example.com/doc.pdf"),
				),
			} as any,
			workspaceAuthorization: {
				excecute: mock(() => Promise.resolve(Result.success(true))),
			} as any,
		};
	});

	const createTestApp = () =>
		new Elysia().use(orderRoutes(mockAuthPlugin as any, mockDeps));

	// =========================================================================
	// 1. POST /v1/workspaces/:workspaceId/orders
	// =========================================================================
	describe("POST /v1/workspaces/:workspaceId/orders", () => {
		test("should return 422 when the request body is invalid (e.g., empty observations)", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/orders`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							...validCreateBody,
							observations: "",
						}),
					},
				),
			);

			expect(response.status).toBe(422);
		});

		test("should return 422 when a component quantity is invalid (e.g., quantity 0)", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/orders`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							...validCreateBody,
							components: [{ id: "01H8X5Y9Z0123456789ABCDEF5", quantity: 0 }],
						}),
					},
				),
			);

			expect(response.status).toBe(422);
		});

		test("should return 422 when the workspaceId param is invalid", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request("http://localhost/v1/workspaces/not-a-valid-id/orders", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(validCreateBody),
				}),
			);

			expect(response.status).toBe(422);
		});

		test("should return 403 if user lacks required roles (e.g., viewer trying to create an order)", async () => {
			mockDeps.workspaceAuthorization.excecute = mock(() =>
				Promise.resolve(
					Result.failure<WorkspaceRole[]>(
						workspaceMemberErrors.INSUFFICIENT_PERMISSIONS,
					),
				),
			);

			const app = createTestApp();
			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/orders`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(validCreateBody),
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

		test("should return 400 when the client does not exist", async () => {
			const app = createTestApp();
			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/orders`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(validCreateBody),
					},
				),
			);

			expect(response.status).toBe(400);

			const body = await response.json();
			expect(body.success).toBe(false);
		});

		test("should return 201 Created when the order is successfully created", async () => {
			mockDeps.clientRepository.getByIds = mock(() =>
				Promise.resolve({
					id: validCreateBody.clientId,
					name: "Juan Pérez",
					email: "juan@example.com",
					phoneNumber: "+5215551234567",
					location: "CDMX",
				} as any),
			);
			mockDeps.deviceRepository.getByIds = mock(() =>
				Promise.resolve({
					id: validCreateBody.deviceId,
					brand: "Samsung",
					model: "Galaxy S21",
					serialNumber: "SN-ABC123",
					components: [
						{
							id: "01H8X5Y9Z0123456789ABCDEF5",
							name: "Batería",
							partNumber: "BAT-001",
							type: "supply",
						},
					],
				} as any),
			);

			const app = createTestApp();
			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/orders`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(validCreateBody),
					},
				),
			);

			expect(response.status).toBe(201);

			const body = await response.json();
			expect(body.success).toBe(true);
			expect(mockWorkspace.increaseCount).toHaveBeenCalled();
		});
	});

	// =========================================================================
	// 2. POST /v1/workspaces/:workspaceId/orders/:orderId/document
	// =========================================================================
	describe("POST /v1/workspaces/:workspaceId/orders/:orderId/document", () => {
		const documentUrl = `http://localhost/v1/workspaces/${validWorkspaceId}/orders/${validOrderId}/document`;

		test("should return 422 when deviceImageBase64 is not a valid data URI", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request(documentUrl, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						...validGenerateDocumentBody,
						deviceImageBase64: "not-a-data-uri",
					}),
				}),
			);

			expect(response.status).toBe(422);
		});

		test("should return 422 when the orderId param is invalid", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/orders/not-a-valid-id/document`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(validGenerateDocumentBody),
					},
				),
			);

			expect(response.status).toBe(422);
		});

		test("should return 403 if user lacks required roles", async () => {
			mockDeps.workspaceAuthorization.excecute = mock(() =>
				Promise.resolve(
					Result.failure<WorkspaceRole[]>(
						workspaceMemberErrors.INSUFFICIENT_PERMISSIONS,
					),
				),
			);

			const app = createTestApp();
			const response = await app.handle(
				new Request(documentUrl, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(validGenerateDocumentBody),
				}),
			);

			expect(response.status).toBe(403);
		});

		test("should return 201 when the document is successfully generated", async () => {
			mockDeps.orderRepository.getById = mock(() =>
				Promise.resolve(buildOrder()),
			);

			const app = createTestApp();
			const response = await app.handle(
				new Request(documentUrl, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(validGenerateDocumentBody),
				}),
			);

			expect(response.status).toBe(201);

			const body = await response.json();
			expect(body.success).toBe(true);
			expect(mockDeps.orderRepository.update).toHaveBeenCalled();
		});
	});

	// =========================================================================
	// 3. GET /v1/workspaces/:workspaceId/orders/:orderId/document
	// =========================================================================
	describe("GET /v1/workspaces/:workspaceId/orders/:orderId/document", () => {
		const documentUrl = `http://localhost/v1/workspaces/${validWorkspaceId}/orders/${validOrderId}/document`;

		test("should return 422 when the orderId param is invalid", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/orders/not-a-valid-id/document`,
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
					Result.failure<WorkspaceRole[]>(workspaceMemberErrors.NOT_A_MEMBER),
				),
			);

			const app = createTestApp();
			const response = await app.handle(
				new Request(documentUrl, {
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

		test("should return 400 when the document has not been generated", async () => {
			mockDeps.orderRepository.getById = mock(() =>
				Promise.resolve(buildOrder()),
			);

			const app = createTestApp();
			const response = await app.handle(
				new Request(documentUrl, {
					method: "GET",
				}),
			);

			expect(response.status).toBe(400);

			const body = await response.json();
			expect(body.success).toBe(false);
		});

		test("should return 200 with the signed download url", async () => {
			mockDeps.orderRepository.getById = mock(() =>
				Promise.resolve(buildOrder({ documentKey: "orders/TEST1.pdf" })),
			);

			const app = createTestApp();
			const response = await app.handle(
				new Request(documentUrl, {
					method: "GET",
				}),
			);

			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body.success).toBe(true);
			expect(body.data).toEqual({
				signedDownloadUrl: "https://cdn.example.com/doc.pdf",
			});
		});
	});
});
