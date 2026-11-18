import type { AuthPlugin } from "@serviceflow/backend/shared/http/auth-plugin";
import { workspaceAuthPlugin } from "@serviceflow/backend/shared/http/workspace-auth-plugin";
import {
	clientIdSchema,
	listClientsQuerySchema,
	registerClientBodySchema,
	workspaceIdSchema,
} from "@serviceflow/schemas";
import Elysia, { t } from "elysia";
import type { UserRepository } from "../user/common/user-repository";
import type { WorkspaceAuthorization } from "../workspace/common/workspace-authorization";
import {
	WORKSPACE_ROLES,
	WORKSPACE_ROLES_ARRAY,
} from "../workspace/common/workspace-member.model";
import type { ClientRepository } from "./common/client-repository";
import type { ClientsUnitOfWork } from "./common/clients.unit-of-work";
import { getClientHandler } from "./get-client";
import { paginatedClientHandler } from "./paginated-clients";
import { registerClientHandler } from "./register-client";

export interface ClientDependencies {
	clientRepository: ClientRepository;
	userRepository: UserRepository;
	unitOfWork: ClientsUnitOfWork;
	workspaceAuthorization: WorkspaceAuthorization;
}

export const clientRoutes = (auth: AuthPlugin, deps: ClientDependencies) =>
	new Elysia({ prefix: "/v1/workspaces" })
		.use(workspaceAuthPlugin(auth, deps.workspaceAuthorization))
		.guard({ auth: true })

		// ---------------------------------------------------------------------
		// 1. POST /v1/workspaces/:workspaceId/clients - Registrar un Cliente
		// ---------------------------------------------------------------------
		.post(
			"/:workspaceId/clients",
			async ({ params, body, auth, status }) => {
				const result = await registerClientHandler({
					command: {
						workspaceId: params.workspaceId,
						userId: auth.userId,
						name: body.name,
						email: body.email,
						phoneNumber: body.phoneNumber,
						location: body.location,
					},
					repository: deps.clientRepository,
					userRepository: deps.userRepository,
					unitOfWork: deps.unitOfWork,
				});

				if (result.isFailure) {
					return status(result.error.statusCode, { ...result.error });
				}

				return status("Created", { clientId: result.value });
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
		// 2. GET /v1/workspaces/:workspaceId/clients/:clientId - Obtener un Cliente
		// ---------------------------------------------------------------------
		.get(
			"/:workspaceId/clients/:clientId",
			async ({ params, status }) => {
				const result = await getClientHandler({
					query: {
						workspaceId: params.workspaceId,
						clientId: params.clientId,
					},
					repository: deps.clientRepository,
				});

				if (result.isFailure) {
					return status(result.error.statusCode, { ...result.error });
				}

				return status("OK", result.value);
			},
			{
				params: t.Object({
					workspaceId: workspaceIdSchema,
					clientId: clientIdSchema,
				}),
				workspaceAuth: {
					requiredRoles: [...WORKSPACE_ROLES_ARRAY],
				},
			},
		)

		// ---------------------------------------------------------------------
		// 3. GET /v1/workspaces/:workspaceId/clients - Listar Clientes Paginados
		// ---------------------------------------------------------------------
		.get(
			"/:workspaceId/clients",
			async ({ params, query, status }) => {
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
					return status(result.error.statusCode, { ...result.error });
				}

				return status("OK", result.value);
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
