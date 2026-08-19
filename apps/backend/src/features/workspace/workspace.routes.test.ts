/** biome-ignore-all lint/suspicious/noExplicitAny: <Just for testing porpuses> */

import { beforeEach, describe, expect, mock, test } from "bun:test";
import { Result } from "@serviceflow/backend/shared/result";
import Elysia from "elysia";
import { workspaceInvitationErrors } from "./common/workspace-invitation.errors";
import { WorkspaceInvitation } from "./common/workspace-invitation.model";
import { workspaceMemberErrors } from "./common/workspace-member.errors";
import {
	WORKSPACE_ROLES,
	WorkspaceMember,
} from "./common/workspace-member.model";
import { type WorkspaceDependencies, workspaceRoutes } from "./index";

const mockUserId = "01H8X5Y9Z0123456789ABCDEF1";

const mockAuthPlugin = new Elysia({ name: "mock-auth" }).derive(
	{ as: "global" },
	() => ({
		auth: {
			userId: mockUserId,
		},
	}),
);

describe("Workspace HTTP Routes - Unit Tests", () => {
	let mockDeps: WorkspaceDependencies;

	beforeEach(() => {
		mock.restore();

		mockDeps = {
			storageService: {} as any,
			mailService: {} as any,
			workspaceRepository: {
				save: mock(() => Promise.resolve()),
			} as any,
			workspaceInvitationRepository: {} as any,
			memberRepository: {} as any,
			workspaceAuthorization: {
				excecute: mock(() => Promise.resolve(Result.success(true))),
			} as any,
			unitOfWork: {} as any,
			userRepository: {} as any,
			appUrl: "https://app.test.com",
			db: {} as any,
		};
	});

	const createTestApp = () =>
		new Elysia().use(workspaceRoutes(mockAuthPlugin as any, mockDeps));

	// =========================================================================
	// 1. POST /v1/workspaces
	// =========================================================================
	describe("POST /v1/workspaces", () => {
		test("should return 422 when the request body is invalid (e.g., empty workspace name)", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request("http://localhost/v1/workspaces", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						workspaceName: "",
						companyDetails: {
							name: " ",
							phone: " ",
							email: " ",
							address: " ",
						},
					}),
				}),
			);

			expect(response.status).toBe(422);
		});

		test("should return 201 Created when the workspace is successfully created", async () => {
			const app = createTestApp();

			const validPayload = {
				workspaceName: "Acme Software HQ",
				companyDetails: {
					name: "Acme Corporation LLC",
					phone: "+15551234567",
					email: "contact@acme.com",
					address: "123 Innovation Way, Suite 100, San Francisco, CA",
				},
			};

			const response = await app.handle(
				new Request("http://localhost/v1/workspaces", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(validPayload),
				}),
			);

			expect(response.status).toBe(201);

			const body = await response.json();
			expect(body.success).toBe(true);
		});
	});

	// =========================================================================
	// 2. GET /v1/workspaces
	// =========================================================================
	describe("GET /v1/workspaces", () => {
		test("should return 422 when query parameters are invalid (e.g., limit > 100)", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request("http://localhost/v1/workspaces?limit=500", {
					method: "GET",
				}),
			);

			expect(response.status).toBe(422);
		});
	});

	// =========================================================================
	// 4. POST /v1/workspaces/:workspaceId/logo/upload-url
	// =========================================================================
	describe("POST /v1/workspaces/:workspaceId/logo/upload-url", () => {
		const validWorkspaceId = "01H8X5Y9Z0123456789ABCDEF2";

		test("should return 403 if user is a member but lacks required roles (e.g., viewer trying to upload logo)", async () => {
			mockDeps.workspaceAuthorization.excecute = mock(() =>
				Promise.resolve(
					Result.failure<WorkspaceMember>(
						workspaceMemberErrors.INSUFFICIENT_PERMISSIONS,
					),
				),
			);

			const app = createTestApp();
			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/logo/upload-url`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							mimeType: "image/png",
							fileExtension: "png",
						}),
					},
				),
			);

			expect(mockDeps.workspaceAuthorization.excecute).toHaveBeenCalledWith({
				workspaceId: validWorkspaceId,
				userId: mockUserId,
				requiredRoles: [WORKSPACE_ROLES.OWNER, WORKSPACE_ROLES.ADMIN],
			});

			expect(response.status).toBe(403);
		});

		test("should deny access and return an error if workspace authorization fails", async () => {
			mockDeps.workspaceAuthorization.excecute = mock(() =>
				Promise.resolve(
					Result.failure<WorkspaceMember>(workspaceMemberErrors.NOT_A_MEMBER),
				),
			);

			const app = createTestApp();

			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/logo/upload-url`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							mimeType: "image/png",
							fileExtension: "png",
						}),
					},
				),
			);

			expect(mockDeps.workspaceAuthorization.excecute).toHaveBeenCalledWith({
				workspaceId: validWorkspaceId,
				userId: mockUserId,
				requiredRoles: [WORKSPACE_ROLES.OWNER, WORKSPACE_ROLES.ADMIN],
			});

			expect(response.status).toBe(
				workspaceMemberErrors.NOT_A_MEMBER.statusCode,
			);
		});

		test("should return 422 if body validation fails due to an unsupported mimeType", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/logo/upload-url`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							mimeType: "text/plain",
							fileExtension: "txt",
						}),
					},
				),
			);

			expect(response.status).toBe(422);
		});
	});

	// =========================================================================
	// 5. POST /v1/workspaces/:workspaceId/invitations
	// =========================================================================
	describe("POST /v1/workspaces/:workspaceId/invitations", () => {
		const validWorkspaceId = "01H8X5Y9Z0123456789ABCDEF2";

		test("should return 422 when attempting to invite a user with the 'owner' role", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/invitations`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							email: "test@example.com",
							role: "owner",
						}),
					},
				),
			);

			expect(response.status).toBe(422);
		});
	});

	// =========================================================================
	// 6. GET /v1/workspaces/:workspaceId/invitations
	// =========================================================================
	describe("GET /v1/workspaces/:workspaceId/invitations", () => {
		const validWorkspaceId = "01H8X5Y9Z0123456789ABCDEF2";

		test("should return 422 when query parameters are invalid (e.g., limit > 100)", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/invitations?limit=500`,
					{ method: "GET" },
				),
			);

			expect(response.status).toBe(422);
		});

		test("should return 403 when the user lacks the required roles", async () => {
			mockDeps.workspaceAuthorization.excecute = mock(() =>
				Promise.resolve(
					Result.failure<WorkspaceMember>(
						workspaceMemberErrors.INSUFFICIENT_PERMISSIONS,
					),
				),
			);

			const app = createTestApp();
			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/invitations`,
					{ method: "GET" },
				),
			);

			expect(mockDeps.workspaceAuthorization.excecute).toHaveBeenCalledWith({
				workspaceId: validWorkspaceId,
				userId: mockUserId,
				requiredRoles: [WORKSPACE_ROLES.OWNER, WORKSPACE_ROLES.ADMIN],
			});

			expect(response.status).toBe(403);
		});

		test("should return 200 with the paginated invitations when authorized", async () => {
			const paginatedResponse = {
				items: [
					{
						token: "token-1",
						email: "invitee@example.com",
						status: "pending",
						issuedAt: "2024-01-01T00:00:00.000Z",
					},
				],
				cursor: null,
				hasNextPage: false,
			};

			mockDeps.workspaceInvitationRepository = {
				getAllPaginated: mock(() => Promise.resolve(paginatedResponse)),
			} as any;

			const app = createTestApp();
			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/invitations?limit=20`,
					{ method: "GET" },
				),
			);

			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body.success).toBe(true);
			expect(body.data).toEqual(paginatedResponse);
			expect(
				mockDeps.workspaceInvitationRepository.getAllPaginated,
			).toHaveBeenCalled();
		});
	});

	// =========================================================================
	// 6. POST /v1/workspaces/invitations/:token/accept
	// =========================================================================
	describe("POST /v1/workspaces/invitations/:token/accept", () => {
		test("should return 404 for missing or malformed invitation tokens in the URL", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request("http://localhost/v1/workspaces/invitations//accept", {
					method: "POST",
				}),
			);

			expect(response.status).toBe(404);
		});
	});

	// =========================================================================
	// 7. PATCH /v1/workspaces/:workspaceId/invitations/:token
	// =========================================================================
	describe("PATCH /v1/workspaces/:workspaceId/invitations/:token", () => {
		const validWorkspaceId = "01H8X5Y9Z0123456789ABCDEF2";
		const validToken = "invitation-token-123";

		const cancelInvitation = (
			workspaceId = validWorkspaceId,
			token = validToken,
		) =>
			new Request(
				`http://localhost/v1/workspaces/${workspaceId}/invitations/${token}`,
				{ method: "PATCH" },
			);

		const reconstituteInvitation = (overrides: Record<string, unknown> = {}) =>
			WorkspaceInvitation.reconstitute({
				token: validToken,
				workspaceId: validWorkspaceId,
				role: "viewer",
				email: "invitee@example.com",
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
				createdAt: new Date(),
				expirationDays: 7,
				emailId: "resend-msg-1",
				status: "pending",
				acceptedAt: null,
				cancelledAt: null,
				rejectedAt: null,
				...overrides,
			});

		test("should return 404 for an empty token in the URL", async () => {
			const app = createTestApp();
			const response = await app.handle(cancelInvitation(validWorkspaceId, ""));

			expect(response.status).toBe(404);
		});

		test("should return 422 when the workspace id is invalid", async () => {
			const app = createTestApp();
			const response = await app.handle(cancelInvitation("invalid-id"));

			expect(response.status).toBe(422);
		});

		test("should return 403 when the user lacks the required roles", async () => {
			mockDeps.workspaceAuthorization.excecute = mock(() =>
				Promise.resolve(
					Result.failure<WorkspaceMember>(
						workspaceMemberErrors.INSUFFICIENT_PERMISSIONS,
					),
				),
			);

			const app = createTestApp();
			const response = await app.handle(cancelInvitation());

			expect(mockDeps.workspaceAuthorization.excecute).toHaveBeenCalledWith({
				workspaceId: validWorkspaceId,
				userId: mockUserId,
				requiredRoles: [WORKSPACE_ROLES.OWNER, WORKSPACE_ROLES.ADMIN],
			});

			expect(response.status).toBe(403);
		});

		test("should return 404 when the user is not a member of the workspace", async () => {
			mockDeps.workspaceAuthorization.excecute = mock(() =>
				Promise.resolve(
					Result.failure<WorkspaceMember>(workspaceMemberErrors.NOT_A_MEMBER),
				),
			);

			const app = createTestApp();
			const response = await app.handle(cancelInvitation());

			expect(response.status).toBe(
				workspaceMemberErrors.NOT_A_MEMBER.statusCode,
			);
		});

		test("should return 404 when the invitation is not found", async () => {
			mockDeps.workspaceInvitationRepository = {
				findByToken: mock(() => Promise.resolve(null)),
				update: mock(() => Promise.resolve()),
			} as any;

			const app = createTestApp();
			const response = await app.handle(cancelInvitation());

			expect(response.status).toBe(
				workspaceInvitationErrors.NOT_FOUND.statusCode,
			);
			expect(
				mockDeps.workspaceInvitationRepository.update,
			).not.toHaveBeenCalled();
		});

		test("should return 400 when the invitation cannot be cancelled", async () => {
			mockDeps.workspaceInvitationRepository = {
				findByToken: mock(() =>
					Promise.resolve(reconstituteInvitation({ status: "accepted" })),
				),
				update: mock(() => Promise.resolve()),
			} as any;

			const app = createTestApp();
			const response = await app.handle(cancelInvitation());

			expect(response.status).toBe(
				workspaceInvitationErrors.CANNOT_CANCEL_ACCEPTED.statusCode,
			);
			expect(
				mockDeps.workspaceInvitationRepository.update,
			).not.toHaveBeenCalled();
		});

		test("should return 200 when the invitation is successfully cancelled", async () => {
			mockDeps.workspaceInvitationRepository = {
				findByToken: mock(() => Promise.resolve(reconstituteInvitation())),
				update: mock(() => Promise.resolve()),
			} as any;
			mockDeps.mailService = {
				cancelInvitationEmail: mock(() => Promise.resolve()),
			} as any;

			const app = createTestApp();
			const response = await app.handle(cancelInvitation());

			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body.success).toBe(true);
			expect(mockDeps.workspaceInvitationRepository.update).toHaveBeenCalled();
			expect(mockDeps.mailService.cancelInvitationEmail).toHaveBeenCalledWith(
				"resend-msg-1",
			);
		});
	});

	// =========================================================================
	// 8. PATCH /v1/workspaces/:workspaceId/members/:memberId
	// =========================================================================
	describe("PATCH /v1/workspaces/:workspaceId/members/:memberId", () => {
		const validWorkspaceId = "01H8X5Y9Z0123456789ABCDEF2";
		const validMemberId = "01H8X5Y9Z0123456789ABCDEF3";

		const patchRole = (body: unknown, memberId = validMemberId) =>
			new Request(
				`http://localhost/v1/workspaces/${validWorkspaceId}/members/${memberId}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				},
			);

		test("should return 422 when the body role is invalid (e.g., owner)", async () => {
			const app = createTestApp();

			const response = await app.handle(patchRole({ role: "owner" }));

			expect(response.status).toBe(422);
		});

		test("should return 422 when the body role is missing", async () => {
			const app = createTestApp();

			const response = await app.handle(patchRole({}));

			expect(response.status).toBe(422);
		});

		test("should return 403 when the user lacks the required roles", async () => {
			mockDeps.workspaceAuthorization.excecute = mock(() =>
				Promise.resolve(
					Result.failure<WorkspaceMember>(
						workspaceMemberErrors.INSUFFICIENT_PERMISSIONS,
					),
				),
			);

			const app = createTestApp();
			const response = await app.handle(patchRole({ role: "admin" }));

			expect(mockDeps.workspaceAuthorization.excecute).toHaveBeenCalledWith({
				workspaceId: validWorkspaceId,
				userId: mockUserId,
				requiredRoles: [WORKSPACE_ROLES.OWNER, WORKSPACE_ROLES.ADMIN],
			});

			expect(response.status).toBe(403);
		});

		test("should return 404 when the user is not a member of the workspace", async () => {
			mockDeps.workspaceAuthorization.excecute = mock(() =>
				Promise.resolve(
					Result.failure<WorkspaceMember>(workspaceMemberErrors.NOT_A_MEMBER),
				),
			);

			const app = createTestApp();
			const response = await app.handle(patchRole({ role: "admin" }));

			expect(response.status).toBe(
				workspaceMemberErrors.NOT_A_MEMBER.statusCode,
			);
		});

		test("should return 200 when the member role is successfully updated", async () => {
			mockDeps.memberRepository = {
				findMembership: mock(() =>
					Promise.resolve(
						WorkspaceMember.reconstitute({
							workspaceId: validWorkspaceId,
							userId: validMemberId,
							role: WORKSPACE_ROLES.VIEWER,
							joinedAt: new Date(),
							updatedAt: new Date(),
						}),
					),
				),
				update: mock(() => Promise.resolve()),
			} as any;

			const app = createTestApp();
			const response = await app.handle(patchRole({ role: "admin" }));

			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body.success).toBe(true);
			expect(mockDeps.memberRepository.update).toHaveBeenCalled();
		});

		test("should return 400 when trying to change the role of the owner", async () => {
			mockDeps.memberRepository = {
				findMembership: mock(() =>
					Promise.resolve(
						WorkspaceMember.reconstitute({
							workspaceId: validWorkspaceId,
							userId: validMemberId,
							role: WORKSPACE_ROLES.OWNER,
							joinedAt: new Date(),
							updatedAt: new Date(),
						}),
					),
				),
				update: mock(() => Promise.resolve()),
			} as any;

			const app = createTestApp();
			const response = await app.handle(patchRole({ role: "admin" }));

			expect(response.status).toBe(
				workspaceMemberErrors.CANNOT_CHANGE_OWNER_ROLE.statusCode,
			);
			expect(mockDeps.memberRepository.update).not.toHaveBeenCalled();
		});

		test("should return 404 when the target member does not belong to the workspace", async () => {
			mockDeps.memberRepository = {
				findMembership: mock(() => Promise.resolve(null)),
				update: mock(() => Promise.resolve()),
			} as any;

			const app = createTestApp();
			const response = await app.handle(patchRole({ role: "admin" }));

			expect(response.status).toBe(
				workspaceMemberErrors.NOT_A_MEMBER.statusCode,
			);
			expect(mockDeps.memberRepository.update).not.toHaveBeenCalled();
		});
	});

	// =========================================================================
	// 9. DELETE /v1/workspaces/:workspaceId/members/:memberId
	// =========================================================================
	describe("DELETE /v1/workspaces/:workspaceId/members/:memberId", () => {
		const validWorkspaceId = "01H8X5Y9Z0123456789ABCDEF2";
		const validMemberId = "01H8X5Y9Z0123456789ABCDEF3";

		const deleteMember = (memberId = validMemberId) =>
			new Request(
				`http://localhost/v1/workspaces/${validWorkspaceId}/members/${memberId}`,
				{ method: "DELETE" },
			);

		const reconstituteMember = (userId: string, role: string) =>
			WorkspaceMember.reconstitute({
				workspaceId: validWorkspaceId,
				userId,
				role: role as never,
				joinedAt: new Date(),
				updatedAt: new Date(),
			});

		test("should return 403 when the user lacks the required roles", async () => {
			mockDeps.workspaceAuthorization.excecute = mock(() =>
				Promise.resolve(
					Result.failure<WorkspaceMember>(
						workspaceMemberErrors.INSUFFICIENT_PERMISSIONS,
					),
				),
			);

			const app = createTestApp();
			const response = await app.handle(deleteMember());

			expect(mockDeps.workspaceAuthorization.excecute).toHaveBeenCalledWith({
				workspaceId: validWorkspaceId,
				userId: mockUserId,
				requiredRoles: [WORKSPACE_ROLES.OWNER, WORKSPACE_ROLES.ADMIN],
			});

			expect(response.status).toBe(403);
		});

		test("should return 404 when the user is not a member of the workspace", async () => {
			mockDeps.workspaceAuthorization.excecute = mock(() =>
				Promise.resolve(
					Result.failure<WorkspaceMember>(workspaceMemberErrors.NOT_A_MEMBER),
				),
			);

			const app = createTestApp();
			const response = await app.handle(deleteMember());

			expect(response.status).toBe(
				workspaceMemberErrors.NOT_A_MEMBER.statusCode,
			);
		});

		test("should return 422 when the member id is invalid", async () => {
			const app = createTestApp();
			const response = await app.handle(deleteMember("invalid-id"));

			expect(response.status).toBe(422);
		});

		test("should return 200 and the removed member id when successfully removed", async () => {
			mockDeps.memberRepository = {
				findMembership: mock(async ({ userId }) =>
					userId === validMemberId
						? reconstituteMember(validMemberId, WORKSPACE_ROLES.VIEWER)
						: reconstituteMember(mockUserId, WORKSPACE_ROLES.ADMIN),
				),
				remove: mock(() => Promise.resolve()),
			} as any;

			const app = createTestApp();
			const response = await app.handle(deleteMember());

			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body.success).toBe(true);
			expect(body.data.memberId).toBe(validMemberId);
			expect(mockDeps.memberRepository.remove).toHaveBeenCalled();
		});

		test("should return 400 when trying to remove the workspace owner", async () => {
			mockDeps.memberRepository = {
				findMembership: mock(async ({ userId }) =>
					userId === validMemberId
						? reconstituteMember(validMemberId, WORKSPACE_ROLES.OWNER)
						: reconstituteMember(mockUserId, WORKSPACE_ROLES.ADMIN),
				),
				remove: mock(() => Promise.resolve()),
			} as any;

			const app = createTestApp();
			const response = await app.handle(deleteMember());

			expect(response.status).toBe(
				workspaceMemberErrors.CANNOT_REMOVE_OWNER.statusCode,
			);
			expect(mockDeps.memberRepository.remove).not.toHaveBeenCalled();
		});

		test("should return 400 when the user tries to remove themselves", async () => {
			mockDeps.memberRepository = {
				findMembership: mock(() =>
					Promise.resolve(
						reconstituteMember(mockUserId, WORKSPACE_ROLES.ADMIN),
					),
				),
				remove: mock(() => Promise.resolve()),
			} as any;

			const app = createTestApp();
			const response = await app.handle(deleteMember(mockUserId));

			expect(response.status).toBe(
				workspaceMemberErrors.CANNOT_REMOVE_SELF.statusCode,
			);
			expect(mockDeps.memberRepository.remove).not.toHaveBeenCalled();
		});

		test("should return 403 when an admin tries to remove another admin", async () => {
			mockDeps.memberRepository = {
				findMembership: mock(async ({ userId }) =>
					userId === validMemberId
						? reconstituteMember(validMemberId, WORKSPACE_ROLES.ADMIN)
						: reconstituteMember(mockUserId, WORKSPACE_ROLES.ADMIN),
				),
				remove: mock(() => Promise.resolve()),
			} as any;

			const app = createTestApp();
			const response = await app.handle(deleteMember());

			expect(response.status).toBe(
				workspaceMemberErrors.ONLY_OWNER_CAN_REMOVE_ADMIN.statusCode,
			);
			expect(mockDeps.memberRepository.remove).not.toHaveBeenCalled();
		});

		test("should return 404 when the target member does not belong to the workspace", async () => {
			mockDeps.memberRepository = {
				findMembership: mock(({ userId }) =>
					userId === validMemberId
						? Promise.resolve(null)
						: Promise.resolve(
								reconstituteMember(mockUserId, WORKSPACE_ROLES.ADMIN),
							),
				),
				remove: mock(() => Promise.resolve()),
			} as any;

			const app = createTestApp();
			const response = await app.handle(deleteMember());

			expect(response.status).toBe(
				workspaceMemberErrors.NOT_A_MEMBER.statusCode,
			);
			expect(mockDeps.memberRepository.remove).not.toHaveBeenCalled();
		});
	});
});
