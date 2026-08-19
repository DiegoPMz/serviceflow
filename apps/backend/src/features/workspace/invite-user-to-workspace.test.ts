import { describe, expect, mock, test } from "bun:test";
import type { DatabaseClient } from "@serviceflow/backend/shared/database";
import { workspaceInvitations } from "@serviceflow/backend/shared/database";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import {
	addMember,
	seedWorkspace,
} from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { ulid } from "ulidx";
import { userDrizzleRepository } from "../user/common/user-drizzle-repository";
import type {
	MailService,
	SendWorkspaceInvitationParams,
} from "./common/mail-service";
import { workspaceMemberDrizzleRepository } from "./common/workspace-drizzle-member-repository";
import { workspaceDrizzleRepository } from "./common/workspace-drizzle-repository";
import {
	type InvitationRole,
	WorkspaceInvitation,
} from "./common/workspace-invitation.model";
import { workspaceInvitationDrizzleRepository } from "./common/workspace-invitation-drizzle-repository";
import { inviteUserToWorkspaceHandler } from "./invite-user-to-workspace";

const APP_URL = "http://localhost:5173";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const validCommand = (
	inviterId: string,
	workspaceId: string,
	email: string,
	overrides: { role?: InvitationRole } = {},
) => ({
	inviterId,
	workspaceId,
	email,
	role: "viewer" as InvitationRole,
	...overrides,
});

const buildMailService = (sent: SendWorkspaceInvitationParams[]) =>
	({
		sendWorkspaceInvitation: mock(
			async (params: SendWorkspaceInvitationParams) => {
				sent.push(params);
				return { emailId: `email-${nanoid(21)}` };
			},
		),
		cancelInvitationEmail: mock(async () => {}),
	}) as MailService;

const buildHandler = (
	tx: DatabaseClient,
	command: ReturnType<typeof validCommand>,
	mailService: MailService,
) =>
	inviteUserToWorkspaceHandler({
		command,
		invitationRepository: workspaceInvitationDrizzleRepository(tx),
		memberRepository: workspaceMemberDrizzleRepository(tx),
		workspaceRepository: workspaceDrizzleRepository(tx),
		userRepository: userDrizzleRepository(tx),
		mailService,
		appUrl: APP_URL,
	});

describe("Invite-User-To-Workspace Integration Tests", () => {
	test("Should invite a new user, persist the invitation and send the email", async () => {
		await runTestInTransaction(async (tx) => {
			const inviterId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx, { name: "Taller Central" });
			await addMember(tx, { userId: inviterId, workspaceId });
			const command = validCommand(
				inviterId,
				workspaceId,
				`invitado-${ulid()}@example.com`,
				{ role: "technician" },
			);
			const sent: SendWorkspaceInvitationParams[] = [];
			const mailService = buildMailService(sent);

			const result = await buildHandler(tx, command, mailService);

			expect(result.isSuccess).toBe(true);

			const [invitation] = await tx
				.select()
				.from(workspaceInvitations)
				.where(eq(workspaceInvitations.workspaceId, workspaceId));

			expect(invitation).toBeDefined();
			expect(invitation?.email).toBe(command.email.toLowerCase());
			expect(invitation?.workspaceId).toBe(workspaceId);
			expect(invitation?.role).toBe("technician");
			expect(invitation?.token).toHaveLength(21);
			expect(invitation?.emailId).toBeDefined();

			const now = Date.now();
			expect(invitation?.expiresAt.getTime()).toBeGreaterThan(
				now + SEVEN_DAYS_MS - 1000,
			);
			expect(invitation?.expiresAt.getTime()).toBeLessThan(
				now + SEVEN_DAYS_MS + 1000,
			);

			expect(sent.length).toBe(1);
			expect(sent[0]?.to).toBe(command.email.toLowerCase());
			expect(sent[0]?.workspaceName).toBe("Taller Central");
			expect(sent[0]?.role).toBe("technician");
			expect(sent[0]?.acceptUrl).toBe(
				`${APP_URL}/invitaciones/aceptar?token=${invitation?.token}`,
			);
		});
	});

	test("Should renew an existing invitation rotating the token and keeping a single row", async () => {
		await runTestInTransaction(async (tx) => {
			const inviterId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId: inviterId, workspaceId });

			const email = `invitee-${ulid()}@example.com`;

			const sent: SendWorkspaceInvitationParams[] = [];
			const firstMail = buildMailService(sent);
			const first = await buildHandler(
				tx,
				validCommand(inviterId, workspaceId, email),
				firstMail,
			);
			expect(first.isSuccess).toBe(true);
			const firstToken = sent[0]?.acceptUrl.split("token=")[1] as string;

			sent.length = 0;
			const second = await buildHandler(
				tx,
				validCommand(inviterId, workspaceId, email),
				buildMailService(sent),
			);
			expect(second.isSuccess).toBe(true);

			const rows = await tx
				.select()
				.from(workspaceInvitations)
				.where(
					and(
						eq(workspaceInvitations.workspaceId, workspaceId),
						eq(workspaceInvitations.email, email.toLowerCase()),
					),
				);

			expect(rows.length).toBe(1);
			expect(rows[0]?.token).not.toBe(firstToken);
			expect(rows[0]?.token).toHaveLength(21);
			expect(sent.length).toBe(1);
			expect(sent[0]?.acceptUrl).toContain(rows[0]?.token as string);
		});
	});

	test("Should return USER_ALREADY_MEMBER when the email already belongs to a member", async () => {
		await runTestInTransaction(async (tx) => {
			const inviterId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId: inviterId, workspaceId });

			const memberEmail = `member-${ulid()}@example.com`;
			const memberId = await seedUser(tx, { email: memberEmail });
			await addMember(tx, { userId: memberId, workspaceId });

			const sent: SendWorkspaceInvitationParams[] = [];
			const result = await buildHandler(
				tx,
				validCommand(inviterId, workspaceId, memberEmail),
				buildMailService(sent),
			);

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("USER_ALREADY_MEMBER");

			const rows = await tx
				.select()
				.from(workspaceInvitations)
				.where(eq(workspaceInvitations.workspaceId, workspaceId));
			expect(rows.length).toBe(0);
			expect(sent.length).toBe(0);
		});
	});

	test("Should return WORKSPACE_NOT_FOUND when the workspace has no members", async () => {
		await runTestInTransaction(async (tx) => {
			const inviterId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);

			const sent: SendWorkspaceInvitationParams[] = [];
			const result = await buildHandler(
				tx,
				validCommand(inviterId, workspaceId, `invitee-${ulid()}@example.com`),
				buildMailService(sent),
			);

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("WORKSPACE_NOT_FOUND");

			const rows = await tx
				.select()
				.from(workspaceInvitations)
				.where(eq(workspaceInvitations.workspaceId, workspaceId));
			expect(rows.length).toBe(0);
			expect(sent.length).toBe(0);
		});
	});

	test("Should return USER_NOT_FOUND when the inviter does not exist", async () => {
		await runTestInTransaction(async (tx) => {
			const inviterId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId: inviterId, workspaceId });

			const sent: SendWorkspaceInvitationParams[] = [];
			const result = await buildHandler(
				tx,
				validCommand(ulid(), workspaceId, `invitee-${ulid()}@example.com`),
				buildMailService(sent),
			);

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("USER_NOT_FOUND");

			const rows = await tx
				.select()
				.from(workspaceInvitations)
				.where(eq(workspaceInvitations.workspaceId, workspaceId));
			expect(rows.length).toBe(0);
			expect(sent.length).toBe(0);
		});
	});

	test("Should return INVITATION_INVALID_ROLE when inviting with the owner role", async () => {
		await runTestInTransaction(async (tx) => {
			const inviterId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId: inviterId, workspaceId });

			const sent: SendWorkspaceInvitationParams[] = [];
			const result = await buildHandler(
				tx,
				{
					inviterId,
					workspaceId,
					email: `invitee-${ulid()}@example.com`,
					role: "owner" as InvitationRole,
				},
				buildMailService(sent),
			);

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("INVITATION_INVALID_ROLE");

			const rows = await tx
				.select()
				.from(workspaceInvitations)
				.where(eq(workspaceInvitations.workspaceId, workspaceId));
			expect(rows.length).toBe(0);
			expect(sent.length).toBe(0);
		});
	});

	test("Should return INVITATION_INVALID_EMAIL when the email format is invalid", async () => {
		await runTestInTransaction(async (tx) => {
			const inviterId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId: inviterId, workspaceId });

			const sent: SendWorkspaceInvitationParams[] = [];
			const result = await buildHandler(
				tx,
				validCommand(inviterId, workspaceId, "not-an-email"),
				buildMailService(sent),
			);

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("INVITATION_INVALID_EMAIL");
			expect(sent.length).toBe(0);
		});
	});

	test("Should return WORKSPACE_NOT_FOUND when the workspace id is empty or whitespace", async () => {
		await runTestInTransaction(async (tx) => {
			const inviterId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId: inviterId, workspaceId });

			const sent: SendWorkspaceInvitationParams[] = [];
			const result = await buildHandler(
				tx,
				validCommand(inviterId, "   ", `invitee-${ulid()}@example.com`),
				buildMailService(sent),
			);

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("WORKSPACE_NOT_FOUND");

			const rows = await tx
				.select()
				.from(workspaceInvitations)
				.where(eq(workspaceInvitations.workspaceId, workspaceId));
			expect(rows.length).toBe(0);
			expect(sent.length).toBe(0);
		});
	});

	for (const role of ["admin", "technician", "viewer"] as const) {
		test(`Should invite a user with the ${role} role`, async () => {
			await runTestInTransaction(async (tx) => {
				const inviterId = await seedUser(tx);
				const workspaceId = await seedWorkspace(tx);
				await addMember(tx, { userId: inviterId, workspaceId });

				const sent: SendWorkspaceInvitationParams[] = [];
				const result = await buildHandler(
					tx,
					validCommand(
						inviterId,
						workspaceId,
						`invitee-${ulid()}@example.com`,
						{ role },
					),
					buildMailService(sent),
				);

				expect(result.isSuccess).toBe(true);
				expect(sent[0]?.role).toBe(role);

				const [invitation] = await tx
					.select()
					.from(workspaceInvitations)
					.where(
						and(
							eq(workspaceInvitations.workspaceId, workspaceId),
							eq(workspaceInvitations.email, sent[0]?.to as string),
						),
					);
				expect(invitation?.role).toBe(role);
			});
		});
	}

	test("Should renew an existing invitation when re-inviting with a different email case", async () => {
		await runTestInTransaction(async (tx) => {
			const inviterId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId: inviterId, workspaceId });

			const email = `invitee-${ulid()}@example.com`;
			const first = await buildHandler(
				tx,
				validCommand(inviterId, workspaceId, email),
				buildMailService([]),
			);
			expect(first.isSuccess).toBe(true);

			const sent: SendWorkspaceInvitationParams[] = [];
			const second = await buildHandler(
				tx,
				validCommand(inviterId, workspaceId, email.toUpperCase()),
				buildMailService(sent),
			);
			expect(second.isSuccess).toBe(true);

			const rows = await tx
				.select()
				.from(workspaceInvitations)
				.where(
					and(
						eq(workspaceInvitations.workspaceId, workspaceId),
						eq(workspaceInvitations.email, email.toLowerCase()),
					),
				);

			expect(rows.length).toBe(1);
			expect(sent[0]?.to).toBe(email.toLowerCase());
			expect(sent[0]?.acceptUrl).toContain(rows[0]?.token as string);
		});
	});

	test("Should not persist the invitation when the mail service fails", async () => {
		await runTestInTransaction(async (tx) => {
			const inviterId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId: inviterId, workspaceId });

			const failingMailService = {
				sendWorkspaceInvitation: mock(async () => {
					throw new Error("Resend service unavailable");
				}),
				cancelInvitationEmail: mock(async () => {}),
			} as MailService;

			const exec = () =>
				buildHandler(
					tx,
					validCommand(inviterId, workspaceId, `invitee-${ulid()}@example.com`),
					failingMailService,
				);

			expect(exec()).rejects.toThrow("Resend service unavailable");

			const rows = await tx
				.select()
				.from(workspaceInvitations)
				.where(eq(workspaceInvitations.workspaceId, workspaceId));
			expect(rows.length).toBe(0);
		});
	});

	test("Should renew an existing invitation preserving the custom expiration days", async () => {
		await runTestInTransaction(async (tx) => {
			const inviterId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId: inviterId, workspaceId });

			const email = `invitee-${ulid()}@example.com`;
			const created = WorkspaceInvitation.create({
				workspaceId,
				role: "viewer",
				email,
				expirationDays: 2,
			});
			expect(created.isSuccess).toBe(true);
			await workspaceInvitationDrizzleRepository(tx).save(created.value);

			const sent: SendWorkspaceInvitationParams[] = [];
			const result = await buildHandler(
				tx,
				validCommand(inviterId, workspaceId, email),
				buildMailService(sent),
			);
			expect(result.isSuccess).toBe(true);

			const [invitation] = await tx
				.select()
				.from(workspaceInvitations)
				.where(
					and(
						eq(workspaceInvitations.workspaceId, workspaceId),
						eq(workspaceInvitations.email, email.toLowerCase()),
					),
				);

			expect(invitation?.expirationDays).toBe(2);
			expect(invitation?.expiresAt.getTime()).toBeLessThan(
				Date.now() + 3 * 24 * 60 * 60 * 1000,
			);
			expect(sent[0]?.acceptUrl).toContain(invitation?.token as string);
		});
	});
});
