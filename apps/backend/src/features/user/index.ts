import type { ApiResponse } from "@serviceflow/backend/shared/http/api-response";
import type { AuthPlugin } from "@serviceflow/backend/shared/http/auth-plugin";
import { respond } from "@serviceflow/backend/shared/http/respond";
import { workspaceAuthPlugin } from "@serviceflow/backend/shared/http/workspace-auth-plugin";
import type { Pagination } from "@serviceflow/backend/shared/pagination";
import { listUsersQuerySchema, workspaceIdSchema } from "@serviceflow/schemas";
import Elysia, { t } from "elysia";
import type { WorkspaceAuthorization } from "../workspace/common/workspace-authorization";
import { WORKSPACE_ROLES_ARRAY } from "../workspace/common/workspace-member.model";
import type { WorkspaceMemberRepository } from "../workspace/common/workspace-member.repository";
import type { UserDto } from "./common/user.dto";
import type { UserDetailsReadModel } from "./common/user-details.read-model";
import type { UserRepository } from "./common/user-repository";
import { getProfileHandler } from "./get-profile";
import { paginatedUserHandler } from "./paginated-users";

export interface UserDependencies {
	userRepository: UserRepository;
	memberRepository: WorkspaceMemberRepository;
	workspaceAuthorization: WorkspaceAuthorization;
}

export const userRoutes = (
	auth: AuthPlugin,
	{
		userRepository,
		memberRepository,
		workspaceAuthorization,
	}: UserDependencies,
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
			new Elysia({ prefix: "/workspaces" })
				.use(workspaceAuthPlugin(auth, workspaceAuthorization))
				.get(
					"/:workspaceId/users",
					async ({
						params,
						query,
						auth,
						set,
					}): Promise<ApiResponse<Pagination<UserDetailsReadModel>>> => {
						const result = await paginatedUserHandler({
							query: {
								workspaceId: params.workspaceId,
								currentUserId: auth.userId,
								paginationRequest: {
									limit: query.limit ?? 20,
									cursor: query.cursor,
									orderBy: query.orderBy ?? "createdAt",
									direction: query.direction ?? "desc",
									search: query.search,
								},
							},
							repository: userRepository,
							memberRepository,
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
						workspaceAuth: {
							requiredRoles: [...WORKSPACE_ROLES_ARRAY],
						},
					},
				),
		);
