import type {
	DatabaseClient,
	DatabaseType,
} from "@serviceflow/backend/shared/database";
import type { ApiResponse } from "@serviceflow/backend/shared/http/api-response";
import type { AuthPlugin } from "@serviceflow/backend/shared/http/auth-plugin";
import { respond } from "@serviceflow/backend/shared/http/respond";
import { workspaceAuthPlugin } from "@serviceflow/backend/shared/http/workspace-auth-plugin";
import type { StorageService } from "@serviceflow/backend/shared/object-storage/storage-service";
import type { Pagination } from "@serviceflow/backend/shared/pagination";
import {
	confirmLogoUploadBodySchema,
	createWorkspaceBodySchema,
	invitationTokenSchema,
	inviteUserToWorkspaceBodySchema,
	listWorkspaceInvitationsQuerySchema,
	listWorkspacesQuerySchema,
	logoUploadUrlBodySchema,
	updateWorkspaceMemberRoleBodySchema,
	workspaceIdSchema,
} from "@serviceflow/schemas";
import Elysia, { t } from "elysia";
import type { UserRepository } from "../user/common/user-repository";
import { acceptWorkspaceInvitationHandler } from "./accept-workspace-invitation";
import { cancelWorkspaceInvitationHandler } from "./cancel-workspace-invitation";
import type { MailService } from "./common/mail-service";
import type { WorkspaceReadModel } from "./common/workspace.read-model";
import type { WorkspaceAuthorization } from "./common/workspace-authorization";
import type { WorkspaceInvitationReadModel } from "./common/workspace-invitation.read-model";
import type { WorkspaceInvitationRepository } from "./common/workspace-invitation-repository";
import {
	WORKSPACE_ROLES,
	WORKSPACE_ROLES_ARRAY,
} from "./common/workspace-member.model";
import type { WorkspaceMemberRepository } from "./common/workspace-member.repository";
import type { WorkspaceRepository } from "./common/workspace-repository";
import type { WorkspacesUnitOfWork } from "./common/workspaces.unit-of-work";
import { confirmLogoUploadHandler } from "./confirm-logo-upload";
import { createWorkspace } from "./create-workspace";
import {
	getWorkspaceSummaryHandler,
	type WorkspaceSummaryReadModel,
} from "./get-workspace-summary";
import { inviteUserToWorkspaceHandler } from "./invite-user-to-workspace";
import { type LogoUploadUrlDto, LogoUploadUrlHandler } from "./logo-upload-url";
import {
	getPaginatedWorkspaceInvitations,
	type WorkspaceInvitationOrderBy,
} from "./paginated-workspace-invitations";
import { getPaginatedWorkspaces } from "./paginated-workspaces";
import { rejectWorkspaceInvitationHandler } from "./reject-workspace-invitation";
import {
	type RemovedWorkspaceMember,
	removeWorkspaceMemberHandler,
} from "./remove-workspace-member";
import { updateWorkspaceMemberRoleHandler } from "./update-workspace-member-role";

export interface WorkspaceDependencies {
	storageService: StorageService;
	mailService: MailService;
	workspaceRepository: WorkspaceRepository;
	workspaceInvitationRepository: WorkspaceInvitationRepository;
	memberRepository: WorkspaceMemberRepository;
	workspaceAuthorization: WorkspaceAuthorization;
	unitOfWork: WorkspacesUnitOfWork;
	userRepository: UserRepository;
	appUrl: string;
	db: DatabaseClient | DatabaseType;
}

const OWNER_ADMIN_ROLES = [WORKSPACE_ROLES.OWNER, WORKSPACE_ROLES.ADMIN];

export const workspaceRoutes = (
	auth: AuthPlugin,
	deps: WorkspaceDependencies,
) =>
	new Elysia({ prefix: "/v1/workspaces" })
		.use(workspaceAuthPlugin(auth, deps.workspaceAuthorization))
		.guard({ auth: true })

		// ---------------------------------------------------------------------
		// 1. POST /v1/workspaces - Crear un Workspace
		// ---------------------------------------------------------------------
		.post(
			"/",
			async ({ body, auth, set }): Promise<ApiResponse<undefined>> => {
				const result = await createWorkspace({
					command: {
						userId: auth.userId,
						workspaceName: body.workspaceName,
						companyDetails: body.companyDetails,
					},
					repository: deps.workspaceRepository,
				});

				if (result.isFailure) {
					return respond.failure(result.error, set);
				}

				return respond.success(undefined, set, 201);
			},
			{
				body: createWorkspaceBodySchema,
				workspaceAuth: {
					enabled: false,
				},
			},
		)

		// ---------------------------------------------------------------------
		// 2. GET /v1/workspaces - Listar Workspaces Paginados
		// ---------------------------------------------------------------------
		.get(
			"/",
			async ({
				query,
				auth,
				set,
			}): Promise<ApiResponse<Pagination<WorkspaceReadModel>>> => {
				const result = await getPaginatedWorkspaces({
					query: {
						userId: auth.userId,
						paginationRequest: {
							limit: query.limit ?? 10,
							cursor: query.cursor,
							orderBy: query.orderBy ?? "id",
							direction: query.direction ?? "asc",
							search: query.search,
						},
					},
					repository: deps.workspaceRepository,
				});

				if (result.isFailure) {
					return respond.failure(result.error, set);
				}

				return respond.success(result.value, set);
			},
			{
				query: listWorkspacesQuerySchema,
				workspaceAuth: {
					enabled: false,
				},
			},
		)

		// ---------------------------------------------------------------------
		// 3. POST /v1/workspaces/invitations/:token/accept - Aceptar invitación
		// ---------------------------------------------------------------------
		.post(
			"/invitations/:token/accept",
			async ({ params, auth, set }): Promise<ApiResponse<undefined>> => {
				const result = await acceptWorkspaceInvitationHandler({
					command: {
						token: params.token,
						userId: auth.userId,
					},
					invitationRepository: deps.workspaceInvitationRepository,
					memberRepository: deps.memberRepository,
					userRepository: deps.userRepository,
					unitOfWork: deps.unitOfWork,
				});

				if (result.isFailure) {
					return respond.failure(result.error, set);
				}

				return respond.success(undefined, set);
			},
			{
				params: t.Object({
					token: invitationTokenSchema,
				}),
				workspaceAuth: {
					enabled: false,
				},
			},
		)

		// ---------------------------------------------------------------------
		// 4. POST /v1/workspaces/invitations/:token/reject - Rechazar invitación
		// ---------------------------------------------------------------------
		.post(
			"/invitations/:token/reject",
			async ({ params, auth, set }): Promise<ApiResponse<undefined>> => {
				const result = await rejectWorkspaceInvitationHandler({
					command: {
						token: params.token,
						userId: auth.userId,
					},
					invitationRepository: deps.workspaceInvitationRepository,
					userRepository: deps.userRepository,
				});

				if (result.isFailure) {
					return respond.failure(result.error, set);
				}

				return respond.success(undefined, set);
			},
			{
				params: t.Object({
					token: invitationTokenSchema,
				}),
				workspaceAuth: {
					enabled: false,
				},
			},
		)

		// ---------------------------------------------------------------------
		// Rutas con :workspaceId - autorización vía workspaceAuthPlugin
		// ---------------------------------------------------------------------

		// ---------------------------------------------------------------------
		// 5. GET /v1/workspaces/:workspaceId - Detalles de Workspace
		// ---------------------------------------------------------------------
		.get(
			"/:workspaceId",
			async ({
				params,
				auth,
				set,
			}): Promise<ApiResponse<WorkspaceSummaryReadModel>> => {
				const result = await getWorkspaceSummaryHandler({
					query: {
						userId: auth.userId,
						workspaceId: params.workspaceId,
					},
					db: deps.db,
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
				workspaceAuth: {
					requiredRoles: [...WORKSPACE_ROLES_ARRAY],
				},
			},
		)

		// ---------------------------------------------------------------------
		// 6. POST /v1/workspaces/:workspaceId/logo/upload-url - Pedir URL de subida
		// ---------------------------------------------------------------------
		.post(
			"/:workspaceId/logo/upload-url",
			async ({ params, body, set }): Promise<ApiResponse<LogoUploadUrlDto>> => {
				const result = await LogoUploadUrlHandler(
					{
						workspaceId: params.workspaceId,
						mimeType: body.mimeType,
						fileExtension: body.fileExtension,
					},
					deps.storageService,
					deps.workspaceRepository,
				);

				if (result.isFailure) {
					return respond.failure(result.error, set);
				}

				return respond.success(result.value, set);
			},
			{
				params: t.Object({
					workspaceId: workspaceIdSchema,
				}),
				body: logoUploadUrlBodySchema,
				workspaceAuth: {
					requiredRoles: [...OWNER_ADMIN_ROLES],
				},
			},
		)

		// ---------------------------------------------------------------------
		// 7. POST /v1/workspaces/:workspaceId/logo/confirm - Confirmar Carga
		// ---------------------------------------------------------------------
		.post(
			"/:workspaceId/logo/confirm",
			async ({ params, body, set }): Promise<ApiResponse<undefined>> => {
				const result = await confirmLogoUploadHandler({
					command: {
						workspaceId: params.workspaceId,
						fileKey: body.fileKey,
					},
					workspaceRepository: deps.workspaceRepository,
					storageService: deps.storageService,
				});

				if (result.isFailure) {
					return respond.failure(result.error, set);
				}

				return respond.success(undefined, set);
			},
			{
				params: t.Object({
					workspaceId: workspaceIdSchema,
				}),
				body: confirmLogoUploadBodySchema,
				workspaceAuth: {
					requiredRoles: [...OWNER_ADMIN_ROLES],
				},
			},
		)

		// ---------------------------------------------------------------------
		// 8. POST /v1/workspaces/:workspaceId/invitations - Invitar usuario
		// ---------------------------------------------------------------------
		.post(
			"/:workspaceId/invitations",
			async ({ params, auth, body, set }): Promise<ApiResponse<undefined>> => {
				const result = await inviteUserToWorkspaceHandler({
					command: {
						inviterId: auth.userId,
						workspaceId: params.workspaceId,
						role: body.role,
						email: body.email,
					},
					invitationRepository: deps.workspaceInvitationRepository,
					memberRepository: deps.memberRepository,
					workspaceRepository: deps.workspaceRepository,
					userRepository: deps.userRepository,
					mailService: deps.mailService,
					appUrl: deps.appUrl,
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
				body: inviteUserToWorkspaceBodySchema,
				workspaceAuth: {
					requiredRoles: [...OWNER_ADMIN_ROLES],
				},
			},
		)

		// ---------------------------------------------------------------------
		// 9. GET /v1/workspaces/:workspaceId/invitations - Listar invitaciones
		// ---------------------------------------------------------------------
		.get(
			"/:workspaceId/invitations",
			async ({
				params,
				query,
				set,
			}): Promise<ApiResponse<Pagination<WorkspaceInvitationReadModel>>> => {
				const result = await getPaginatedWorkspaceInvitations({
					query: {
						workspaceId: params.workspaceId,
						paginationRequest: {
							limit: query.limit ?? 20,
							cursor: query.cursor,
							orderBy: (query.orderBy ??
								"createdAt") as WorkspaceInvitationOrderBy,
							direction: query.direction ?? "desc",
						},
					},
					repository: deps.workspaceInvitationRepository,
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
				query: listWorkspaceInvitationsQuerySchema,
				workspaceAuth: {
					requiredRoles: [...OWNER_ADMIN_ROLES],
				},
			},
		)

		// ---------------------------------------------------------------------
		// 10. PATCH /v1/workspaces/:workspaceId/invitations/:token - Cancelar invitación
		// ---------------------------------------------------------------------
		.patch(
			"/:workspaceId/invitations/:token",
			async ({ params, set }): Promise<ApiResponse<undefined>> => {
				const result = await cancelWorkspaceInvitationHandler({
					command: {
						workspaceId: params.workspaceId,
						invitationToken: params.token,
					},
					workspaceInvitationRepository: deps.workspaceInvitationRepository,
					mailService: deps.mailService,
				});

				if (result.isFailure) {
					return respond.failure(result.error, set);
				}

				return respond.success(undefined, set);
			},
			{
				params: t.Object({
					workspaceId: workspaceIdSchema,
					token: invitationTokenSchema,
				}),
				workspaceAuth: {
					requiredRoles: [...OWNER_ADMIN_ROLES],
				},
			},
		)

		// ---------------------------------------------------------------------
		// 11. PATCH /v1/workspaces/:workspaceId/members/:memberId - Cambiar rol
		// ---------------------------------------------------------------------
		.patch(
			"/:workspaceId/members/:memberId",
			async ({ params, body, set }): Promise<ApiResponse<undefined>> => {
				const result = await updateWorkspaceMemberRoleHandler({
					command: {
						workspaceId: params.workspaceId,
						targetUserId: params.memberId,
						newRole: body.role,
					},
					workspaceMemberRepository: deps.memberRepository,
				});

				if (result.isFailure) {
					return respond.failure(result.error, set);
				}

				return respond.success(undefined, set);
			},
			{
				params: t.Object({
					workspaceId: workspaceIdSchema,
					memberId: workspaceIdSchema,
				}),
				body: updateWorkspaceMemberRoleBodySchema,
				workspaceAuth: {
					requiredRoles: [...OWNER_ADMIN_ROLES],
				},
			},
		)

		// ---------------------------------------------------------------------
		// 12. DELETE /v1/workspaces/:workspaceId/members/:memberId - Eliminar miembro
		// ---------------------------------------------------------------------
		.delete(
			"/:workspaceId/members/:memberId",
			async ({
				params,
				auth,
				set,
			}): Promise<ApiResponse<RemovedWorkspaceMember>> => {
				const result = await removeWorkspaceMemberHandler({
					command: {
						workspaceId: params.workspaceId,
						requesterUserId: auth.userId,
						targetUserId: params.memberId,
					},
					workspaceMemberRepository: deps.memberRepository,
				});

				if (result.isFailure) {
					return respond.failure(result.error, set);
				}

				return respond.success(result.value, set);
			},
			{
				params: t.Object({
					workspaceId: workspaceIdSchema,
					memberId: workspaceIdSchema,
				}),
				workspaceAuth: {
					requiredRoles: [...OWNER_ADMIN_ROLES],
				},
			},
		);
