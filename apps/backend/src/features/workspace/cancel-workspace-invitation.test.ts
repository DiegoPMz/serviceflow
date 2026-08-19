import { describe, expect, mock, test } from "bun:test";
import type { DatabaseClient } from "@serviceflow/backend/shared/database";
import { workspaceInvitations } from "@serviceflow/backend/shared/database";
import {
	seedWorkspace,
	seedWorkspaceInvitation,
} from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid/non-secure";
import { ulid } from "ulidx";
import { cancelWorkspaceInvitationHandler } from "./cancel-workspace-invitation";
import type { MailService } from "./common/mail-service";
import { workspaceInvitationErrors } from "./common/workspace-invitation.errors";
import { workspaceInvitationDrizzleRepository } from "./common/workspace-invitation-drizzle-repository";

const inviteEmail = (prefix: string) => `${prefix}-${ulid()}@example.com`;

const buildMailService = (cancelled: string[]) =>
	({
		cancelInvitationEmail: mock(async (emailId: string) => {
			cancelled.push(emailId);
		}),
		sendWorkspaceInvitation: mock(async () => ({ emailId: "irrelevant" })),
	}) as MailService;

const buildHandler = (
	tx: DatabaseClient,
	command: { workspaceId: string; invitationToken: string },
	mailService: MailService,
) =>
	cancelWorkspaceInvitationHandler({
		command,
		workspaceInvitationRepository: workspaceInvitationDrizzleRepository(tx),
		mailService,
	});

const findInvitation = async (tx: DatabaseClient, token: string) => {
	const rows = await tx
		.select()
		.from(workspaceInvitations)
		.where(eq(workspaceInvitations.token, token));
	return rows[0];
};

describe("Cancel-Workspace-Invitation Integration Tests", () => {
	test("Should cancel a pending invitation persisting the cancelled status", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const invitation = await seedWorkspaceInvitation(tx, {
				workspaceId,
				email: inviteEmail("invitado"),
				emailId: "resend-msg-123",
			});

			const cancelled: string[] = [];
			const result = await buildHandler(
				tx,
				{ workspaceId, invitationToken: invitation.token },
				buildMailService(cancelled),
			);

			expect(result.isSuccess).toBe(true);

			const persisted = await findInvitation(tx, invitation.token);
			expect(persisted).toBeDefined();
			expect(persisted?.status).toBe("cancelled");
			expect(persisted?.cancelledAt).toBeDefined();

			expect(cancelled).toEqual(["resend-msg-123"]);
		});
	});

	test("Should not cancel the email when the invitation has no emailId", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const invitation = await seedWorkspaceInvitation(tx, {
				workspaceId,
				email: inviteEmail("invitado"),
			});

			const cancelled: string[] = [];
			const result = await buildHandler(
				tx,
				{ workspaceId, invitationToken: invitation.token },
				buildMailService(cancelled),
			);

			expect(result.isSuccess).toBe(true);
			expect(cancelled.length).toBe(0);

			const persisted = await findInvitation(tx, invitation.token);
			expect(persisted?.status).toBe("cancelled");
		});
	});

	test("Should return INVITATION_NOT_FOUND when the token does not exist", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			const cancelled: string[] = [];
			const result = await buildHandler(
				tx,
				{ workspaceId, invitationToken: nanoid(21) },
				buildMailService(cancelled),
			);

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(workspaceInvitationErrors.NOT_FOUND.code);
		});
	});

	test("Should return INVITATION_NOT_FOUND when the token belongs to another workspace", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const otherWorkspaceId = await seedWorkspace(tx);
			const invitation = await seedWorkspaceInvitation(tx, {
				workspaceId,
				email: inviteEmail("invitado"),
			});

			const cancelled: string[] = [];
			const result = await buildHandler(
				tx,
				{ workspaceId: otherWorkspaceId, invitationToken: invitation.token },
				buildMailService(cancelled),
			);

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(workspaceInvitationErrors.NOT_FOUND.code);
		});
	});

	test("Should return CANNOT_CANCEL_ACCEPTED when the invitation was already accepted", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const invitation = await seedWorkspaceInvitation(tx, {
				workspaceId,
				email: inviteEmail("invitado"),
			});

			const acceptResult = invitation.accept();
			expect(acceptResult.isSuccess).toBe(true);
			await workspaceInvitationDrizzleRepository(tx).update(invitation);

			const cancelled: string[] = [];
			const result = await buildHandler(
				tx,
				{ workspaceId, invitationToken: invitation.token },
				buildMailService(cancelled),
			);

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(
				workspaceInvitationErrors.CANNOT_CANCEL_ACCEPTED.code,
			);
		});
	});

	test("Should return CANNOT_CANCEL_REJECTED when the invitation was already rejected", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const invitation = await seedWorkspaceInvitation(tx, {
				workspaceId,
				email: inviteEmail("invitado"),
			});

			const rejectResult = invitation.reject();
			expect(rejectResult.isSuccess).toBe(true);
			await workspaceInvitationDrizzleRepository(tx).update(invitation);

			const cancelled: string[] = [];
			const result = await buildHandler(
				tx,
				{ workspaceId, invitationToken: invitation.token },
				buildMailService(cancelled),
			);

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(
				workspaceInvitationErrors.CANNOT_CANCEL_REJECTED.code,
			);
		});
	});

	test("Should return ALREADY_CANCELLED when the invitation was already cancelled", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const invitation = await seedWorkspaceInvitation(tx, {
				workspaceId,
				email: inviteEmail("invitado"),
			});

			const cancelResult = invitation.cancel();
			expect(cancelResult.isSuccess).toBe(true);
			await workspaceInvitationDrizzleRepository(tx).update(invitation);

			const cancelled: string[] = [];
			const result = await buildHandler(
				tx,
				{ workspaceId, invitationToken: invitation.token },
				buildMailService(cancelled),
			);

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(
				workspaceInvitationErrors.ALREADY_CANCELLED.code,
			);
		});
	});

	test("Should return success even when cancelling the email fails", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const invitation = await seedWorkspaceInvitation(tx, {
				workspaceId,
				email: inviteEmail("invitado"),
				emailId: "resend-msg-456",
			});

			const failingMailService = {
				cancelInvitationEmail: mock(async () => {
					throw new Error("Resend service unavailable");
				}),
				sendWorkspaceInvitation: mock(async () => ({ emailId: "irrelevant" })),
			} as MailService;

			const result = await buildHandler(
				tx,
				{ workspaceId, invitationToken: invitation.token },
				failingMailService,
			);

			expect(result.isSuccess).toBe(true);

			const persisted = await findInvitation(tx, invitation.token);
			expect(persisted?.status).toBe("cancelled");
		});
	});
});
