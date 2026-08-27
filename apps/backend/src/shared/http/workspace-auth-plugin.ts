import type { WorkspaceAuthorization } from "@serviceflow/backend/features/workspace/common/workspace-authorization";
import type { WorkspaceRole } from "@serviceflow/backend/features/workspace/common/workspace-member.model";
import { workspaceIdSchema } from "@serviceflow/schemas";
import Elysia, { t } from "elysia";
import { AuthErrors } from "../auth/auth.errors";
import type { AuthPlugin } from "./auth-plugin";

export const workspaceAuthPlugin = (
	auth: AuthPlugin,
	authorization: WorkspaceAuthorization,
) =>
	new Elysia()
		.use(auth)
		.guard({ auth: true, params: t.Object({ workspaceId: workspaceIdSchema }) })
		.macro(
			"workspaceAuth",
			({
				requiredRoles = [],
				enabled = true,
			}: {
				requiredRoles?: WorkspaceRole[];
				enabled?: boolean;
			}) => ({
				beforeHandle: async ({ auth, params, status }) => {
					if (!auth) {
						return status(AuthErrors.UNAUTHENTICATED_USER.statusCode, {
							...AuthErrors.UNAUTHENTICATED_USER,
						});
					}

					if (enabled) {
						const authResult = await authorization.excecute({
							workspaceId: params.workspaceId,
							userId: auth.userId,
							requiredRoles,
						});

						if (authResult.isFailure) {
							return status(authResult.error.statusCode, {
								...authResult.error,
							});
						}
					}
				},
			}),
		);

export type WorkspaceAuthPlugin = ReturnType<typeof workspaceAuthPlugin>;
