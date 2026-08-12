import type { ApiResponse } from "@serviceflow/backend/shared/http/api-response";
import type { AuthPlugin } from "@serviceflow/backend/shared/http/auth-plugin";
import { respond } from "@serviceflow/backend/shared/http/respond";
import type { StorageService } from "@serviceflow/backend/shared/object-storage/storage-service";
import {
	createOrderBodySchema,
	generateOrderDocumentBodySchema,
	orderIdSchema,
	workspaceIdSchema,
} from "@serviceflow/schemas";
import Elysia, { t } from "elysia";
import type { ClientRepository } from "../client/common/client-repository";
import type { DeviceRepository } from "../device/common/device-repository";
import type { UserRepository } from "../user/common/user-repository";
import type { WorkspaceAuthorization } from "../workspace/common/workspace-authorization";
import { WORKSPACE_ROLES } from "../workspace/common/workspace-member.model";
import type { WorkspaceRepository } from "../workspace/common/workspace-repository";
import type { OrderRepository } from "./common/order-repository";
import type { PdfGenerator } from "./common/pdf-generator";
import { createOrderHandler } from "./create-order";
import { generateOrderDocumentHandler } from "./generate-order-document";
import { GetOrderDocumentHandler } from "./get-order-document-url";

export interface OrderDependencies {
	orderRepository: OrderRepository;
	clientRepository: ClientRepository;
	deviceRepository: DeviceRepository;
	workspaceRepository: WorkspaceRepository;
	userRepository: UserRepository;
	pdfGenerator: PdfGenerator;
	storageService: StorageService;
	workspaceAuthorization: WorkspaceAuthorization;
}

export const orderRoutes = (auth: AuthPlugin, deps: OrderDependencies) =>
	new Elysia({ prefix: "/v1/workspaces" })
		.use(auth)

		// ---------------------------------------------------------------------
		// 1. POST /v1/workspaces/:workspaceId/orders - Crear una Orden
		// ---------------------------------------------------------------------
		.post(
			"/:workspaceId/orders",
			async ({ params, auth, body, set }): Promise<ApiResponse<undefined>> => {
				const authResult = await deps.workspaceAuthorization.excecute({
					workspaceId: params.workspaceId,
					userId: auth.userId,
					requiredRoles: [
						WORKSPACE_ROLES.OWNER,
						WORKSPACE_ROLES.ADMIN,
						WORKSPACE_ROLES.TECHNICIAN,
					],
				});

				if (authResult.isFailure) {
					return respond.failure(authResult.error, set);
				}

				const result = await createOrderHandler({
					command: {
						workspaceId: params.workspaceId,
						userId: auth.userId,
						clientId: body.clientId,
						deviceId: body.deviceId,
						components: body.components,
						observations: body.observations,
					},
					orderRepository: deps.orderRepository,
					clientRepository: deps.clientRepository,
					deviceRepository: deps.deviceRepository,
					workspaceRepository: deps.workspaceRepository,
					userRepository: deps.userRepository,
				});

				if (result.isFailure) {
					return respond.failure(result.error, set);
				}

				return respond.success(undefined, set, 201);
			},
			{
				auth: true,
				params: t.Object({
					workspaceId: workspaceIdSchema,
				}),
				body: createOrderBodySchema,
			},
		)

		// ---------------------------------------------------------------------
		// 2. POST /v1/workspaces/:workspaceId/orders/:orderId/document - Generar documento
		// ---------------------------------------------------------------------
		.post(
			"/:workspaceId/orders/:orderId/document",
			async ({ params, auth, body, set }): Promise<ApiResponse<undefined>> => {
				const authResult = await deps.workspaceAuthorization.excecute({
					workspaceId: params.workspaceId,
					userId: auth.userId,
					requiredRoles: [
						WORKSPACE_ROLES.OWNER,
						WORKSPACE_ROLES.ADMIN,
						WORKSPACE_ROLES.TECHNICIAN,
					],
				});

				if (authResult.isFailure) {
					return respond.failure(authResult.error, set);
				}

				const result = await generateOrderDocumentHandler({
					command: {
						orderId: params.orderId,
						deviceImageBase64: body.deviceImageBase64,
						clientSignatureBase64: body.clientSignatureBase64,
					},
					orderRepository: deps.orderRepository,
					workspaceRepository: deps.workspaceRepository,
					pdfGenerator: deps.pdfGenerator,
					storageService: deps.storageService,
				});

				if (result.isFailure) {
					return respond.failure(result.error, set);
				}

				return respond.success(undefined, set, 201);
			},
			{
				auth: true,
				params: t.Object({
					workspaceId: workspaceIdSchema,
					orderId: orderIdSchema,
				}),
				body: generateOrderDocumentBodySchema,
			},
		)

		// ---------------------------------------------------------------------
		// 3. GET /v1/workspaces/:workspaceId/orders/:orderId/document - URL del documento
		// ---------------------------------------------------------------------
		.get(
			"/:workspaceId/orders/:orderId/document",
			async ({
				params,
				auth,
				set,
			}): Promise<ApiResponse<{ signedDownloadUrl: string }>> => {
				const authResult = await deps.workspaceAuthorization.excecute({
					workspaceId: params.workspaceId,
					userId: auth.userId,
					requiredRoles: [
						WORKSPACE_ROLES.OWNER,
						WORKSPACE_ROLES.ADMIN,
						WORKSPACE_ROLES.TECHNICIAN,
						WORKSPACE_ROLES.VIEWER,
					],
				});

				if (authResult.isFailure) {
					return respond.failure(authResult.error, set);
				}

				const result = await GetOrderDocumentHandler({
					query: { orderId: params.orderId },
					storageService: deps.storageService,
					orderRepository: deps.orderRepository,
				});

				if (result.isFailure) {
					return respond.failure(result.error, set);
				}

				return respond.success(result.value, set);
			},
			{
				auth: true,
				params: t.Object({
					workspaceId: workspaceIdSchema,
					orderId: orderIdSchema,
				}),
			},
		);
