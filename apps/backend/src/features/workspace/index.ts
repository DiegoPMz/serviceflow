import type {
	DatabaseClient,
	DatabaseType,
} from "@serviceflow/backend/shared/database";
import type { ApiResponse } from "@serviceflow/backend/shared/http/api-response";
import type { AuthPlugin } from "@serviceflow/backend/shared/http/auth-plugin";
import { respond } from "@serviceflow/backend/shared/http/respond";
import type { StorageService } from "@serviceflow/backend/shared/object-storage/storage-service";
import type { Pagination } from "@serviceflow/backend/shared/pagination";
import {
	confirmLogoUploadBodySchema,
	createWorkspaceBodySchema,
	invitationTokenSchema,
	inviteUserToWorkspaceBodySchema,
	listWorkspacesQuerySchema,
	logoUploadUrlBodySchema,
	workspaceIdSchema,
} from "@serviceflow/schemas";
import Elysia, { t } from "elysia";
import type { UserRepository } from "../user/common/user-repository";
import { acceptWorkspaceInvitationHandler } from "./accept-workspace-invitation";
import type { MailService } from "./common/mail-service";
import type { WorkspaceReadModel } from "./common/workspace.read-model";
import type { WorkspaceAuthorization } from "./common/workspace-authorization";
import type { WorkspaceInvitationRepository } from "./common/workspace-invitation-repository";
import { WORKSPACE_ROLES } from "./common/workspace-member.model";
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
import { getPaginatedWorkspaces } from "./paginated-workspaces";
import { rejectWorkspaceInvitationHandler } from "./reject-workspace-invitation";

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

export const workspaceRoutes = (
	auth: AuthPlugin,
	deps: WorkspaceDependencies,
) =>
	new Elysia({ prefix: "/v1/workspaces" })
		.use(auth)

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
				auth: true,
				body: createWorkspaceBodySchema,
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
				auth: true,
				query: listWorkspacesQuerySchema,
			},
		)

		// ---------------------------------------------------------------------
		// 3. GET /v1/workspaces/:workspaceId - Detalles de Workspace
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
				auth: true,
				params: t.Object({
					workspaceId: workspaceIdSchema,
				}),
			},
		)

		// ---------------------------------------------------------------------
		// 3. POST /v1/workspaces/:workspaceId/logo/upload-url - Pedir URL de subida
		// ---------------------------------------------------------------------
		.post(
			"/:workspaceId/logo/upload-url",
			async ({
				params,
				auth,
				body,
				set,
			}): Promise<ApiResponse<LogoUploadUrlDto>> => {
				const authResult = await deps.workspaceAuthorization.excecute({
					workspaceId: params.workspaceId,
					userId: auth.userId,
					requiredRoles: [WORKSPACE_ROLES.OWNER, WORKSPACE_ROLES.ADMIN],
				});

				if (authResult.isFailure) {
					return respond.failure(authResult.error, set);
				}

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
				auth: true,
				params: t.Object({
					workspaceId: workspaceIdSchema,
				}),
				body: logoUploadUrlBodySchema,
			},
		)

		// ---------------------------------------------------------------------
		// 4. POST /v1/workspaces/:workspaceId/logo/confirm - Confirmar Carga
		// ---------------------------------------------------------------------
		.post(
			"/:workspaceId/logo/confirm",
			async ({ params, auth, body, set }): Promise<ApiResponse<undefined>> => {
				const authResult = await deps.workspaceAuthorization.excecute({
					workspaceId: params.workspaceId,
					userId: auth.userId,
					requiredRoles: [WORKSPACE_ROLES.OWNER, WORKSPACE_ROLES.ADMIN],
				});

				if (authResult.isFailure) {
					return respond.failure(authResult.error, set);
				}

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
				auth: true,
				params: t.Object({
					workspaceId: workspaceIdSchema,
				}),
				body: confirmLogoUploadBodySchema,
			},
		)

		// ---------------------------------------------------------------------
		// 5. POST /v1/workspaces/:workspaceId/invitations - Invitar usuario
		// ---------------------------------------------------------------------
		.post(
			"/:workspaceId/invitations",
			async ({ params, auth, body, set }): Promise<ApiResponse<undefined>> => {
				const authResult = await deps.workspaceAuthorization.excecute({
					workspaceId: params.workspaceId,
					userId: auth.userId,
					requiredRoles: [WORKSPACE_ROLES.OWNER, WORKSPACE_ROLES.ADMIN],
				});

				if (authResult.isFailure) {
					return respond.failure(authResult.error, set);
				}

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
				auth: true,
				params: t.Object({
					workspaceId: workspaceIdSchema,
				}),
				body: inviteUserToWorkspaceBodySchema,
			},
		)

		// ---------------------------------------------------------------------
		// 6. POST /v1/workspaces/invitations/:token/accept - Aceptar invitación
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
				auth: true,
				params: t.Object({
					token: invitationTokenSchema,
				}),
			},
		)

		// ---------------------------------------------------------------------
		// 7. POST /v1/workspaces/invitations/:token/reject - Rechazar invitación
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
				auth: true,
				params: t.Object({
					token: invitationTokenSchema,
				}),
			},
		);
