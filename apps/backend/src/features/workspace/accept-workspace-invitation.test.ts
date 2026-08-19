import { describe, expect, test } from "bun:test";
import type { DatabaseClient } from "@serviceflow/backend/shared/database";
import {
	workspaceInvitations,
	workspaceMembers,
} from "@serviceflow/backend/shared/database";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import {
	addMember,
	seedExpiredWorkspaceInvitation,
	seedWorkspace,
	seedWorkspaceInvitation,
} from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid/non-secure";
import { ulid } from "ulidx";
import { userDrizzleRepository } from "../user/common/user-drizzle-repository";
import { acceptWorkspaceInvitationHandler } from "./accept-workspace-invitation";
import { workspaceMemberDrizzleRepository } from "./common/workspace-drizzle-member-repository";
import { workspaceInvitationErrors } from "./common/workspace-invitation.errors";
import { workspaceInvitationDrizzleRepository } from "./common/workspace-invitation-drizzle-repository";
import { workspaceMemberErrors } from "./common/workspace-member.errors";
import type {
	WorkspacesRepositories,
	WorkspacesUnitOfWork,
} from "./common/workspaces.unit-of-work";

const inviteEmail = (prefix: string) => `${prefix}-${ulid()}@example.com`;

const buildUnitOfWork = (tx: DatabaseClient): WorkspacesUnitOfWork => ({
	transaction: async <R>(
		fn: (txRepos: WorkspacesRepositories) => Promise<R>,
	): Promise<R> =>
		fn({
			invitations: workspaceInvitationDrizzleRepository(tx),
			members: workspaceMemberDrizzleRepository(tx),
		}),
});

const buildHandler = (
	tx: DatabaseClient,
	command: { token: string; userId: string },
) =>
	acceptWorkspaceInvitationHandler({
		command,
		invitationRepository: workspaceInvitationDrizzleRepository(tx),
		userRepository: userDrizzleRepository(tx),
		memberRepository: workspaceMemberDrizzleRepository(tx),
		unitOfWork: buildUnitOfWork(tx),
	});

const countMemberships = async (
	tx: DatabaseClient,
	userId: string,
	workspaceId: string,
) => {
	const rows = await tx
		.select()
		.from(workspaceMembers)
		.where(
			and(
				eq(workspaceMembers.userId, userId),
				eq(workspaceMembers.workspaceId, workspaceId),
			),
		);
	return rows;
};

const countInvitations = async (tx: DatabaseClient, token: string) => {
	const rows = await tx
		.select()
		.from(workspaceInvitations)
		.where(eq(workspaceInvitations.token, token));
	return rows;
};

describe("Accept-Workspace-Invitation Integration Tests", () => {
	test("Should accept a valid invitation creating a member and marking the invitation as accepted", async () => {
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

			const memberships = await countMemberships(tx, userId, workspaceId);
			expect(memberships.length).toBe(1);
			expect(memberships[0]?.role).toBe("viewer");

			const remaining = await countInvitations(tx, invitation.token);
			expect(remaining.length).toBe(1);
			expect(remaining[0]?.status).toBe("accepted");
			expect(remaining[0]?.acceptedAt).toBeDefined();
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
			const workspaceId = await seedWorkspace(tx);

			const result = await buildHandler(tx, {
				token: nanoid(21),
				userId,
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(workspaceInvitationErrors.NOT_FOUND.code);

			const memberships = await countMemberships(tx, userId, workspaceId);
			expect(memberships.length).toBe(0);
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

			const memberships = await countMemberships(tx, userId, workspaceId);
			expect(memberships.length).toBe(0);
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

			const memberships = await countMemberships(tx, userId, workspaceId);
			expect(memberships.length).toBe(0);
		});
	});

	test("Should accept the invitation when the user email differs by case and whitespace", async () => {
		await runTestInTransaction(async (tx) => {
			const email = inviteEmail("account").toLowerCase();
			const userId = await seedUser(tx, { email: ` ${email.toUpperCase()} ` });
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

			const memberships = await countMemberships(tx, userId, workspaceId);
			expect(memberships.length).toBe(1);

			const remaining = await countInvitations(tx, invitation.token);
			expect(remaining.length).toBe(1);
			expect(remaining[0]?.status).toBe("accepted");
		});
	});

	test("Should return USER_ALREADY_MEMBER when the token is reused after acceptance", async () => {
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
			expect(second.error.code).toBe(
				workspaceMemberErrors.USER_ALREADY_MEMBER.code,
			);

			const memberships = await countMemberships(tx, userId, workspaceId);
			expect(memberships.length).toBe(1);
		});
	});

	test("Should return a failure result when the user is already a member of the workspace", async () => {
		await runTestInTransaction(async (tx) => {
			const email = inviteEmail("invitado");
			const userId = await seedUser(tx, { email });
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId, role: "owner" });
			const invitation = await seedWorkspaceInvitation(tx, {
				workspaceId,
				email,
			});

			const result = await buildHandler(tx, {
				token: invitation.token,
				userId,
			});

			expect(result.isFailure).toBe(true);
			expect(result.error).toEqual(workspaceMemberErrors.USER_ALREADY_MEMBER);

			const stillThere = await countInvitations(tx, invitation.token);
			expect(stillThere.length).toBe(1);
		});
	});
});
