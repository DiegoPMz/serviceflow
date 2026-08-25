import type { ApiResponse } from "@serviceflow/backend/shared/http/api-response";
import type { AuthPlugin } from "@serviceflow/backend/shared/http/auth-plugin";
import { respond } from "@serviceflow/backend/shared/http/respond";
import { workspaceAuthPlugin } from "@serviceflow/backend/shared/http/workspace-auth-plugin";
import type { StorageService } from "@serviceflow/backend/shared/object-storage/storage-service";
import type { Pagination } from "@serviceflow/backend/shared/pagination";
import type { RealtimePublisher } from "@serviceflow/backend/shared/realtime/realtime-publisher";
import {
	changeOrderStatusBodySchema,
	createOrderBodySchema,
	generateOrderDocumentBodySchema,
	listOrdersQuerySchema,
	orderIdSchema,
	workspaceIdSchema,
} from "@serviceflow/schemas";
import Elysia, { t } from "elysia";
import type { ClientRepository } from "../client/common/client-repository";
import type { DeviceRepository } from "../device/common/device-repository";
import type { UserRepository } from "../user/common/user-repository";
import type { WorkspaceAuthorization } from "../workspace/common/workspace-authorization";
import {
	WORKSPACE_ROLES,
	WORKSPACE_ROLES_ARRAY,
} from "../workspace/common/workspace-member.model";
import type { WorkspaceRepository } from "../workspace/common/workspace-repository";
import { changeOrderStatusHandler } from "./change-order-status";
import type { OrderDetailsReadModel } from "./common/order-details.read-model";
import type { OrderRepository } from "./common/order-repository";
import type { OrderSummaryReadModel } from "./common/order-summary.read-model";
import type { PdfGenerator } from "./common/pdf-generator";
import { createOrderHandler } from "./create-order";
import { generateOrderDocumentHandler } from "./generate-order-document";
import { publishOrderCreatedEvent } from "./get-order-created-event-payload";
import { getOrderDetailsHandler } from "./get-order-details";
import { GetOrderDocumentHandler } from "./get-order-document-url";
import { paginatedOrderHandler } from "./paginated-orders";

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

export const orderRoutes = (
	auth: AuthPlugin,
	deps: OrderDependencies,
	realtimePublisher: RealtimePublisher,
) =>
	new Elysia({ prefix: "/v1/workspaces" })
		.use(workspaceAuthPlugin(auth, deps.workspaceAuthorization))
		.guard({ auth: true })

		// ---------------------------------------------------------------------
		// 1. POST /v1/workspaces/:workspaceId/orders - Crear una Orden
		// ---------------------------------------------------------------------
		.post(
			"/:workspaceId/orders",
			async ({ params, auth, body, set }): Promise<ApiResponse<string>> => {
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

				await publishOrderCreatedEvent({
					query: {
						orderId: result.value,
						userId: auth.userId,
						workspaceId: params.workspaceId,
					},
					orderRepository: deps.orderRepository,
					userRepository: deps.userRepository,
					realtimePublisher,
				});

				return respond.success(result.value, set, 201);
			},
			{
				params: t.Object({ workspaceId: workspaceIdSchema }),
				body: createOrderBodySchema,
				workspaceAuth: {
					requiredRoles: [
						WORKSPACE_ROLES.OWNER,
						WORKSPACE_ROLES.ADMIN,
						WORKSPACE_ROLES.TECHNICIAN,
					],
				},
			},
		)

		// ---------------------------------------------------------------------
		// 2. GET /v1/workspaces/:workspaceId/orders - Listar Órdenes Paginadas
		// ---------------------------------------------------------------------
		.get(
			"/:workspaceId/orders",
			async ({
				params,
				query,
				set,
			}): Promise<ApiResponse<Pagination<OrderSummaryReadModel>>> => {
				const result = await paginatedOrderHandler({
					query: {
						workspaceId: params.workspaceId,
						status: query.status,
						paginationRequest: {
							limit: query.limit ?? 10,
							cursor: query.cursor,
							orderBy: query.orderBy ?? "createdAt",
							direction: query.direction ?? "desc",
							search: query.search,
						},
					},
					repository: deps.orderRepository,
				});

				if (result.isFailure) {
					return respond.failure(result.error, set);
				}

				return respond.success(result.value, set);
			},
			{
				params: t.Object({ workspaceId: workspaceIdSchema }),
				query: listOrdersQuerySchema,
				workspaceAuth: {
					requiredRoles: [...WORKSPACE_ROLES_ARRAY],
				},
			},
		)

		// ---------------------------------------------------------------------
		// 3. GET /v1/workspaces/:workspaceId/orders/:orderId - Detalles de una Orden
		// ---------------------------------------------------------------------
		.get(
			"/:workspaceId/orders/:orderId",
			async ({ params, set }): Promise<ApiResponse<OrderDetailsReadModel>> => {
				const result = await getOrderDetailsHandler({
					query: {
						workspaceId: params.workspaceId,
						orderId: params.orderId,
					},
					orderRepository: deps.orderRepository,
					userRepository: deps.userRepository,
				});

				if (result.isFailure) {
					return respond.failure(result.error, set);
				}

				return respond.success(result.value, set);
			},
			{
				params: t.Object({
					workspaceId: workspaceIdSchema,
					orderId: orderIdSchema,
				}),
				workspaceAuth: {
					requiredRoles: [...WORKSPACE_ROLES_ARRAY],
				},
			},
		)

		// ---------------------------------------------------------------------
		// 4. PATCH /v1/workspaces/:workspaceId/orders/:orderId/status - Cambiar estado
		// ---------------------------------------------------------------------
		.patch(
			"/:workspaceId/orders/:orderId/status",
			async ({ params, body, set }): Promise<ApiResponse<undefined>> => {
				const result = await changeOrderStatusHandler({
					command: {
						orderId: params.orderId,
						status: body.status,
					},
					orderRepository: deps.orderRepository,
				});

				if (result.isFailure) {
					return respond.failure(result.error, set);
				}

				return respond.success(undefined, set);
			},
			{
				params: t.Object({
					workspaceId: workspaceIdSchema,
					orderId: orderIdSchema,
				}),
				body: changeOrderStatusBodySchema,
				workspaceAuth: {
					requiredRoles: [
						WORKSPACE_ROLES.OWNER,
						WORKSPACE_ROLES.ADMIN,
						WORKSPACE_ROLES.TECHNICIAN,
					],
				},
			},
		)

		// ---------------------------------------------------------------------
		// 5. POST /v1/workspaces/:workspaceId/orders/:orderId/document - Generar documento
		// ---------------------------------------------------------------------
		.post(
			"/:workspaceId/orders/:orderId/document",
			async ({ params, body, set }): Promise<ApiResponse<undefined>> => {
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
				params: t.Object({
					workspaceId: workspaceIdSchema,
					orderId: orderIdSchema,
				}),
				body: generateOrderDocumentBodySchema,
				workspaceAuth: {
					requiredRoles: [
						WORKSPACE_ROLES.OWNER,
						WORKSPACE_ROLES.ADMIN,
						WORKSPACE_ROLES.TECHNICIAN,
					],
				},
			},
		)

		// ---------------------------------------------------------------------
		// 6. GET /v1/workspaces/:workspaceId/orders/:orderId/document - URL del documento
		// ---------------------------------------------------------------------
		.get(
			"/:workspaceId/orders/:orderId/document",
			async ({
				params,
				set,
			}): Promise<ApiResponse<{ signedDownloadUrl: string }>> => {
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
				params: t.Object({
					workspaceId: workspaceIdSchema,
					orderId: orderIdSchema,
				}),
				workspaceAuth: {
					requiredRoles: [...WORKSPACE_ROLES_ARRAY],
				},
			},
		);
