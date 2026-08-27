import type { AuthPlugin } from "@serviceflow/backend/shared/http/auth-plugin";
import { workspaceAuthPlugin } from "@serviceflow/backend/shared/http/workspace-auth-plugin";
import {
	deviceIdSchema,
	listDeviceComponentsQuerySchema,
	listDevicesQuerySchema,
	registerDeviceBodySchema,
	workspaceIdSchema,
} from "@serviceflow/schemas";
import Elysia, { t } from "elysia";
import type { WorkspaceAuthorization } from "../workspace/common/workspace-authorization";
import {
	WORKSPACE_ROLES,
	WORKSPACE_ROLES_ARRAY,
} from "../workspace/common/workspace-member.model";
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
		.use(workspaceAuthPlugin(auth, deps.workspaceAuthorization))

		// ---------------------------------------------------------------------
		// 1. POST /v1/workspaces/:workspaceId/devices - Registrar un Dispositivo
		// ---------------------------------------------------------------------
		.post(
			"/:workspaceId/devices",
			async ({ params, body, status }) => {
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
					return status(result.error.statusCode, { ...result.error });
				}

				return status("Created", { deviceId: result.value });
			},
			{
				params: t.Object({
					workspaceId: workspaceIdSchema,
				}),
				body: registerDeviceBodySchema,
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
		// 2. GET /v1/workspaces/:workspaceId/devices - Listar Dispositivos Paginados
		// ---------------------------------------------------------------------
		.get(
			"/:workspaceId/devices",
			async ({ params, query, status }) => {
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
					return status(result.error.statusCode, { ...result.error });
				}

				return status("OK", result.value);
			},
			{
				params: t.Object({
					workspaceId: workspaceIdSchema,
				}),
				query: listDevicesQuerySchema,
				workspaceAuth: {
					requiredRoles: [...WORKSPACE_ROLES_ARRAY],
				},
			},
		)

		// ---------------------------------------------------------------------
		// 3. GET /v1/workspaces/:workspaceId/devices/:deviceId/components - Listar componentes paginados
		// ---------------------------------------------------------------------
		.get(
			"/:workspaceId/devices/:deviceId/components",
			async ({ params, query, status }) => {
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
					return status(result.error.statusCode, { ...result.error });
				}

				return status("OK", result.value);
			},
			{
				params: t.Object({
					workspaceId: workspaceIdSchema,
					deviceId: deviceIdSchema,
				}),
				query: listDeviceComponentsQuerySchema,
				workspaceAuth: {
					requiredRoles: [...WORKSPACE_ROLES_ARRAY],
				},
			},
		);
