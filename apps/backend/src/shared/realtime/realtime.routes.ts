import type { WorkspaceAuthorization } from "@serviceflow/backend/features/workspace/common/workspace-authorization";
import { WORKSPACE_ROLES_ARRAY } from "@serviceflow/backend/features/workspace/common/workspace-member.model";
import Elysia from "elysia";
import type { AuthPlugin } from "../http/auth-plugin";
import { workspaceAuthPlugin } from "../http/workspace-auth-plugin";

export interface RealtimeRouterDependencies {
	workspaceAuthorization: WorkspaceAuthorization;
}

export const realtimeRouter = (
	auth: AuthPlugin,
	deps: RealtimeRouterDependencies,
) =>
	new Elysia({ prefix: "/v1/realtime" })
		.use(workspaceAuthPlugin(auth, deps.workspaceAuthorization))
		.guard(
			{
				auth: true,
				workspaceAuth: {
					requiredRoles: [...WORKSPACE_ROLES_ARRAY],
				},
			},
			(app) =>
				app.ws("/workspaces/:workspaceId", {
					open({ data, subscribe }) {
						const { workspaceId } = data.params;
						subscribe(`workspace:${workspaceId}`);
					},
				}),
		);
