import type { ApiResponse } from "@serviceflow/backend/shared/http/api-response";
import type { AuthPlugin } from "@serviceflow/backend/shared/http/auth-plugin";
import { respond } from "@serviceflow/backend/shared/http/respond";
import type { Pagination } from "@serviceflow/backend/shared/pagination";
import { listUsersQuerySchema, workspaceIdSchema } from "@serviceflow/schemas";
import Elysia, { t } from "elysia";
import type { WorkspaceAuthorization } from "../workspace/common/workspace-authorization";
import { WORKSPACE_ROLES } from "../workspace/common/workspace-member.model";
import type { UserDto } from "./common/user.dto";
import type { UserDetailsReadModel } from "./common/user-details.read-model";
import type { UserRepository } from "./common/user-repository";
import { getProfileHandler } from "./get-profile";
import { paginatedUserHandler } from "./paginated-users";

export interface UserDependencies {
	userRepository: UserRepository;
	workspaceAuthorization: WorkspaceAuthorization;
}

export const userRoutes = (
	auth: AuthPlugin,
	{ userRepository, workspaceAuthorization }: UserDependencies,
) =>
	new Elysia({ prefix: "/v1" })
		// =========================================================================
		// 1. GET /v1/users/me
		// =========================================================================
		.use(
			new Elysia({ prefix: "/users" }).use(auth).get(
				"/me",
				async ({ auth, set }): Promise<ApiResponse<UserDto>> => {
					const result = await getProfileHandler({
						query: { userId: auth.userId },
						repository: userRepository,
					});

					if (result.isFailure) {
						return respond.failure(result.error, set);
					}

					return respond.success(result.value, set);
				},
				{
					auth: true,
				},
			),
		)

		// =========================================================================
		// 2. GET /v1/workspaces/:workspaceId/users Usuarios paginados
		// =========================================================================
		.use(
			new Elysia({ prefix: "/workspaces" }).use(auth).get(
				"/:workspaceId/users",
				async ({
					params,
					query,
					auth,
					set,
				}): Promise<ApiResponse<Pagination<UserDetailsReadModel>>> => {
					const authResult = await workspaceAuthorization.excecute({
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

					const result = await paginatedUserHandler({
						query: {
							workspaceId: params.workspaceId,
							paginationRequest: {
								limit: query.limit ?? 20,
								cursor: query.cursor,
								orderBy: query.orderBy ?? "createdAt",
								direction: query.direction ?? "desc",
								search: query.search,
							},
							currentUserRoles: [authResult.value.role],
						},
						repository: userRepository,
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
					query: listUsersQuerySchema,
				},
			),
		);
