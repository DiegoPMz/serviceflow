import type { AuthPlugin } from "@serviceflow/backend/shared/http/auth-plugin";
import { workspaceAuthPlugin } from "@serviceflow/backend/shared/http/workspace-auth-plugin";
import {
	listActivitiesQuerySchema,
	workspaceIdSchema,
} from "@serviceflow/schemas";
import Elysia, { t } from "elysia";
import type { WorkspaceAuthorization } from "../workspace/common/workspace-authorization";
import { WORKSPACE_ROLES_ARRAY } from "../workspace/common/workspace-member.model";
import type { WorkspaceActivityRepository } from "./common/activity-repository";
import {
	ACTIVITIES_DEFAULT_LIMIT,
	getRecentActivitiesHandler,
} from "./get-recent-activities";

export interface ActivityDependencies {
	activityRepository: WorkspaceActivityRepository;
	workspaceAuthorization: WorkspaceAuthorization;
}

export const activityRoutes = (auth: AuthPlugin, deps: ActivityDependencies) =>
	new Elysia({ prefix: "/v1/workspaces" })
		.use(workspaceAuthPlugin(auth, deps.workspaceAuthorization))
		.guard({ auth: true })

		// ---------------------------------------------------------------------
		// 1. GET /v1/workspaces/:workspaceId/activities - Actividad reciente
		// ---------------------------------------------------------------------
		.get(
			"/:workspaceId/activities",
			async ({ params, query, status }) => {
				const result = await getRecentActivitiesHandler({
					query: {
						workspaceId: params.workspaceId,
						limit: query.limit ?? ACTIVITIES_DEFAULT_LIMIT,
					},
					repository: deps.activityRepository,
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
				query: listActivitiesQuerySchema,
				workspaceAuth: {
					requiredRoles: [...WORKSPACE_ROLES_ARRAY],
				},
			},
		);
