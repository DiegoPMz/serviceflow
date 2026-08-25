import type { ApiResponse } from "@serviceflow/backend/shared/http/api-response";
import type { AuthPlugin } from "@serviceflow/backend/shared/http/auth-plugin";
import { respond } from "@serviceflow/backend/shared/http/respond";
import { workspaceAuthPlugin } from "@serviceflow/backend/shared/http/workspace-auth-plugin";
import type { Pagination } from "@serviceflow/backend/shared/pagination";
import {
	listClientsQuerySchema,
	registerClientBodySchema,
	workspaceIdSchema,
} from "@serviceflow/schemas";
import Elysia, { t } from "elysia";
import type { WorkspaceAuthorization } from "../workspace/common/workspace-authorization";
import {
	WORKSPACE_ROLES,
	WORKSPACE_ROLES_ARRAY,
} from "../workspace/common/workspace-member.model";
import type { ClientReadModel } from "./common/client.read-model";
import type { ClientRepository } from "./common/client-repository";
import { paginatedClientHandler } from "./paginated-clients";
import { registerClientHandler } from "./register-client";

export interface ClientDependencies {
	clientRepository: ClientRepository;
	workspaceAuthorization: WorkspaceAuthorization;
}

export const clientRoutes = (auth: AuthPlugin, deps: ClientDependencies) =>
	new Elysia({ prefix: "/v1/workspaces" })
		.use(workspaceAuthPlugin(auth, deps.workspaceAuthorization))

		// ---------------------------------------------------------------------
		// 1. POST /v1/workspaces/:workspaceId/clients - Registrar un Cliente
		// ---------------------------------------------------------------------
		.post(
			"/:workspaceId/clients",
			async ({ params, body, set }): Promise<ApiResponse<undefined>> => {
				const result = await registerClientHandler({
					command: {
						workspaceId: params.workspaceId,
						name: body.name,
						email: body.email,
						phoneNumber: body.phoneNumber,
						location: body.location,
					},
					repository: deps.clientRepository,
				});

				if (result.isFailure) {
					return respond.failure(result.error, set);
				}

				return respond.success(undefined, set, 201);
			},
			{
				params: t.Object({
					workspaceId: workspaceIdSchema,
				}),
				body: registerClientBodySchema,
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
		// 2. GET /v1/workspaces/:workspaceId/clients - Listar Clientes Paginados
		// ---------------------------------------------------------------------
		.get(
			"/:workspaceId/clients",
			async ({
				params,
				query,
				set,
			}): Promise<ApiResponse<Pagination<ClientReadModel>>> => {
				const result = await paginatedClientHandler({
					query: {
						workspaceId: params.workspaceId,
						paginationRequest: {
							limit: query.limit ?? 10,
							cursor: query.cursor,
							orderBy: query.orderBy ?? "name",
							direction: query.direction ?? "asc",
							search: query.search,
						},
					},
					repository: deps.clientRepository,
				});

				if (result.isFailure) {
					return respond.failure(result.error, set);
				}

				return respond.success(result.value, set);
			},
			{
				params: t.Object({
					workspaceId: workspaceIdSchema,
				}),
				query: listClientsQuerySchema,
				workspaceAuth: {
					requiredRoles: [...WORKSPACE_ROLES_ARRAY],
				},
			},
		);
