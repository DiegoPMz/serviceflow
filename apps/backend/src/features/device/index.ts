import type { ApiResponse } from "@serviceflow/backend/shared/http/api-response";
import type { AuthPlugin } from "@serviceflow/backend/shared/http/auth-plugin";
import { respond } from "@serviceflow/backend/shared/http/respond";
import type { Pagination } from "@serviceflow/backend/shared/pagination";
import {
	deviceIdSchema,
	listDeviceComponentsQuerySchema,
	listDevicesQuerySchema,
	registerDeviceBodySchema,
	workspaceIdSchema,
} from "@serviceflow/schemas";
import Elysia, { t } from "elysia";
import type { WorkspaceAuthorization } from "../workspace/common/workspace-authorization";
import { WORKSPACE_ROLES } from "../workspace/common/workspace-member.model";
import type { DeviceReadModel } from "./common/device.read-model";
import type { DeviceComponentReadModel } from "./common/device-component.read-model";
import type { DeviceRepository } from "./common/device-repository";
import { paginatedDeviceComponentsHandler } from "./get-paginated-device-components";
import { paginatedDeviceHandler } from "./paginated-devices";
import { registerDeviceHandler } from "./register-device";

export interface DeviceDependencies {
	deviceRepository: DeviceRepository;
	workspaceAuthorization: WorkspaceAuthorization;
}

export const deviceRoutes = (auth: AuthPlugin, deps: DeviceDependencies) =>
	new Elysia({ prefix: "/v1/workspaces" })
		.use(auth)

		// ---------------------------------------------------------------------
		// 1. POST /v1/workspaces/:workspaceId/devices - Registrar un Dispositivo
		// ---------------------------------------------------------------------
		.post(
			"/:workspaceId/devices",
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

				const result = await registerDeviceHandler({
					command: {
						workspaceId: params.workspaceId,
						clientId: body.clientId,
						serialNumber: body.serialNumber,
						brand: body.brand,
						model: body.model,
						components: body.components,
					},
					repository: deps.deviceRepository,
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
				body: registerDeviceBodySchema,
			},
		)

		// ---------------------------------------------------------------------
		// 2. GET /v1/workspaces/:workspaceId/devices - Listar Dispositivos Paginados
		// ---------------------------------------------------------------------
		.get(
			"/:workspaceId/devices",
			async ({
				params,
				query,
				auth,
				set,
			}): Promise<ApiResponse<Pagination<DeviceReadModel>>> => {
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

				const result = await paginatedDeviceHandler({
					query: {
						workspaceId: params.workspaceId,
						paginationRequest: {
							limit: query.limit ?? 10,
							cursor: query.cursor,
							orderBy: query.orderBy ?? "brand",
							direction: query.direction ?? "asc",
							search: query.search,
						},
						clientId: query.clientId,
					},
					repository: deps.deviceRepository,
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
				}),
				query: listDevicesQuerySchema,
			},
		)

		// ---------------------------------------------------------------------
		// 3. GET /v1/workspaces/:workspaceId/devices/:deviceId/components - Listar componentes paginados
		// ---------------------------------------------------------------------
		.get(
			"/:workspaceId/devices/:deviceId/components",
			async ({
				params,
				query,
				auth,
				set,
			}): Promise<ApiResponse<Pagination<DeviceComponentReadModel>>> => {
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

				const result = await paginatedDeviceComponentsHandler({
					query: {
						workspaceId: params.workspaceId,
						deviceId: params.deviceId,
						paginationRequest: {
							limit: query.limit ?? 10,
							cursor: query.cursor,
							orderBy: query.orderBy ?? "createdAt",
							direction: query.direction ?? "asc",
							search: query.search,
						},
					},
					repository: deps.deviceRepository,
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
					deviceId: deviceIdSchema,
				}),
				query: listDeviceComponentsQuerySchema,
			},
		);
