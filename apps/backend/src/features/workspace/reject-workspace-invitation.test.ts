import { describe, expect, test } from "bun:test";
import type { DatabaseClient } from "@serviceflow/backend/shared/database";
import { workspaceInvitations } from "@serviceflow/backend/shared/database";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import {
	seedExpiredWorkspaceInvitation,
	seedWorkspace,
	seedWorkspaceInvitation,
} from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid/non-secure";
import { ulid } from "ulidx";
import { userDrizzleRepository } from "../user/common/user-drizzle-repository";
import { workspaceInvitationErrors } from "./common/workspace-invitation.errors";
import { workspaceInvitationDrizzleRepository } from "./common/workspace-invitation-drizzle-repository";
import { rejectWorkspaceInvitationHandler } from "./reject-workspace-invitation";

const inviteEmail = (prefix: string) => `${prefix}-${ulid()}@example.com`;

const buildHandler = (
	tx: DatabaseClient,
	command: { token: string; userId: string },
) =>
	rejectWorkspaceInvitationHandler({
		command,
		invitationRepository: workspaceInvitationDrizzleRepository(tx),
		userRepository: userDrizzleRepository(tx),
	});

const countInvitations = async (tx: DatabaseClient, token: string) => {
	const rows = await tx
		.select()
		.from(workspaceInvitations)
		.where(eq(workspaceInvitations.token, token));
	return rows;
};

describe("Reject-Workspace-Invitation Integration Tests", () => {
	test("Should reject a valid invitation deleting it", async () => {
		await runTestInTransaction(async (tx) => {
			const email = inviteEmail("invitado");
			const userId = await seedUser(tx, { email });
			const workspaceId = await seedWorkspace(tx);
			const invitation = await seedWorkspaceInvitation(tx, {
				workspaceId,
				email,
			});

			const result = await buildHandler(tx, {
				token: invitation.token,
				userId,
			});

			expect(result.isSuccess).toBe(true);

			const remaining = await countInvitations(tx, invitation.token);
			expect(remaining.length).toBe(0);
		});
	});

	test("Should return USER_NOT_FOUND when the user does not exist", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const invitation = await seedWorkspaceInvitation(tx, {
				workspaceId,
				email: inviteEmail("invitado"),
			});

			const result = await buildHandler(tx, {
				token: invitation.token,
				userId: ulid(),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("USER_NOT_FOUND");

			const stillThere = await countInvitations(tx, invitation.token);
			expect(stillThere.length).toBe(1);
		});
	});

	test("Should return INVITATION_NOT_FOUND when the token does not exist", async () => {
		await runTestInTransaction(async (tx) => {
			const email = inviteEmail("invitado");
			const userId = await seedUser(tx, { email });
			const _workspaceId = await seedWorkspace(tx);

			const result = await buildHandler(tx, {
				token: nanoid(21),
				userId,
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(workspaceInvitationErrors.NOT_FOUND.code);
		});
	});

	test("Should return INVITATION_EXPIRED when the invitation has expired", async () => {
		await runTestInTransaction(async (tx) => {
			const email = inviteEmail("invitado");
			const userId = await seedUser(tx, { email });
			const workspaceId = await seedWorkspace(tx);
			const invitation = await seedExpiredWorkspaceInvitation(tx, {
				workspaceId,
				email,
			});

			const result = await buildHandler(tx, {
				token: invitation.token,
				userId,
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(workspaceInvitationErrors.EXPIRED.code);

			const stillThere = await countInvitations(tx, invitation.token);
			expect(stillThere.length).toBe(1);
		});
	});

	test("Should return INVITATION_EMAIL_MISMATCH when the user email differs from the invitation", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx, { email: inviteEmail("usuario") });
			const workspaceId = await seedWorkspace(tx);
			const invitation = await seedWorkspaceInvitation(tx, {
				workspaceId,
				email: inviteEmail("destinatario"),
			});

			const result = await buildHandler(tx, {
				token: invitation.token,
				userId,
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(
				workspaceInvitationErrors.EMAIL_MISMATCH.code,
			);

			const still = await countInvitations(tx, invitation.token);
			expect(still.length).toBe(1);
		});
	});

	test("Should return INVITATION_NOT_FOUND when the token is reused after rejection", async () => {
		await runTestInTransaction(async (tx) => {
			const email = inviteEmail("invitado");
			const userId = await seedUser(tx, { email });
			const workspaceId = await seedWorkspace(tx);
			const invitation = await seedWorkspaceInvitation(tx, {
				workspaceId,
				email,
			});

			const first = await buildHandler(tx, {
				token: invitation.token,
				userId,
			});
			expect(first.isSuccess).toBe(true);

			const second = await buildHandler(tx, {
				token: invitation.token,
				userId,
			});
			expect(second.isFailure).toBe(true);
			expect(second.error.code).toBe(workspaceInvitationErrors.NOT_FOUND.code);
		});
	});
});
