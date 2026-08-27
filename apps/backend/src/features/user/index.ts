import type { AuthPlugin } from "@serviceflow/backend/shared/http/auth-plugin";
import { workspaceAuthPlugin } from "@serviceflow/backend/shared/http/workspace-auth-plugin";
import { listUsersQuerySchema, workspaceIdSchema } from "@serviceflow/schemas";
import Elysia, { t } from "elysia";
import type { WorkspaceAuthorization } from "../workspace/common/workspace-authorization";
import { WORKSPACE_ROLES_ARRAY } from "../workspace/common/workspace-member.model";
import type { WorkspaceMemberRepository } from "../workspace/common/workspace-member.repository";
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
				async ({ auth, status }) => {
					const result = await getProfileHandler({
						query: { userId: auth.userId },
						repository: userRepository,
					});

					if (result.isFailure) {
						return status(result.error.statusCode, { ...result.error });
					}

					return status(200, result.value);
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
					async ({ params, query, auth, status }) => {
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
							return status(result.error.statusCode, { ...result.error });
						}

						return status(200, result.value);
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
