import { describe, expect, test } from "bun:test";
import {
	clients,
	type DatabaseClient,
	workspaceActivities,
} from "@serviceflow/backend/shared/database";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import { seedWorkspace } from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { CLIENT_ERROR_CODES } from "@serviceflow/error-codes";
import { and, eq } from "drizzle-orm";
import { ulid } from "ulidx";
import { userDrizzleRepository } from "../user/common/user-drizzle-repository";
import { clientDrizzleRepository } from "./common/client-drizzle-repository";
import { createDrizzleClientsUnitOfWork } from "./common/clients-drizzle.unit-of-work";
import {
	type RegisterClientCommand,
	registerClientHandler,
} from "./register-client";

const validCommand = (
	workspaceId: string,
	userId: string,
	overrides: Partial<RegisterClientCommand> = {},
): RegisterClientCommand => ({
	name: "Juan Pérez",
	email: `juan-${ulid()}@example.com`,
	phoneNumber: "+5215551234567",
	workspaceId,
	userId,
	location: "CDMX",
	...overrides,
});

const registerClient = (tx: DatabaseClient, command: RegisterClientCommand) =>
	registerClientHandler({
		command,
		repository: clientDrizzleRepository(tx),
		userRepository: userDrizzleRepository(tx),
		unitOfWork: createDrizzleClientsUnitOfWork(tx),
	});

describe("Register-Client Integration Tests", () => {
	test("Should register a client successfully and persist it", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const userId = await seedUser(tx);
			const command = validCommand(workspaceId, userId);

			const result = await registerClient(tx, command);

			expect(result.isSuccess).toBe(true);
			expect(result.value).toBeString();

			const [client] = await tx
				.select()
				.from(clients)
				.where(eq(clients.id, result.value as string));

			expect(client?.name).toBe(command.name);
			expect(client?.email).toBe(command.email);
			expect(client?.phoneNumber).toBe(command.phoneNumber);
			expect(client?.location).toBe(command.location);
			expect(client?.workspaceId).toBe(workspaceId);
			expect(client?.createdAt).toBeInstanceOf(Date);
			expect(client?.updatedAt).toBeInstanceOf(Date);
		});
	});

	test("Should record a CLIENT_CREATED activity along with the client", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const userId = await seedUser(tx);
			const command = validCommand(workspaceId, userId);

			const result = await registerClient(tx, command);

			expect(result.isSuccess).toBe(true);

			const [activity] = await tx
				.select()
				.from(workspaceActivities)
				.where(
					and(
						eq(workspaceActivities.workspaceId, workspaceId),
						eq(workspaceActivities.type, "CLIENT_CREATED"),
					),
				);

			expect(activity).toBeDefined();
			expect(activity?.entityId).toBe(result.value as string);
			expect(activity?.entityLabel).toBe(command.name);
			expect(activity?.actorUserId).toBe(userId);
			expect(activity?.actorNameSnapshot).toBe("Test User Perez");
			expect(activity?.metadata).toBeNull();
			expect(activity?.createdAt).toBeInstanceOf(Date);
		});
	});

	test("Should return CLIENT_ALREADY_EXISTS when email is already registered", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const userId = await seedUser(tx);
			const command = validCommand(workspaceId, userId);

			await registerClient(tx, command);

			const result = await registerClient(
				tx,
				validCommand(workspaceId, userId, { email: command.email }),
			);

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(CLIENT_ERROR_CODES.ALREADY_EXISTS);

			const rows = await tx
				.select()
				.from(clients)
				.where(eq(clients.email, command.email));
			expect(rows.length).toBe(1);

			const activities = await tx
				.select()
				.from(workspaceActivities)
				.where(eq(workspaceActivities.workspaceId, workspaceId));
			expect(activities.length).toBe(1);
		});
	});

	test("Should return CLIENT_ALREADY_EXISTS when phone is already registered", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const userId = await seedUser(tx);
			const command = validCommand(workspaceId, userId);

			await registerClient(tx, command);

			const result = await registerClient(
				tx,
				validCommand(workspaceId, userId, {
					phoneNumber: command.phoneNumber,
				}),
			);

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe(CLIENT_ERROR_CODES.ALREADY_EXISTS);

			const rows = await tx.select().from(clients);
			expect(rows.length).toBe(1);

			const activities = await tx
				.select()
				.from(workspaceActivities)
				.where(eq(workspaceActivities.workspaceId, workspaceId));
			expect(activities.length).toBe(1);
		});
	});

	test("Should return USER_NOT_FOUND and not persist anything when the user does not exist", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const command = validCommand(workspaceId, ulid());

			const result = await registerClient(tx, command);

			expect(result.isFailure).toBe(true);

			const rows = await tx.select().from(clients);
			expect(rows.length).toBe(0);

			const activities = await tx.select().from(workspaceActivities);
			expect(activities.length).toBe(0);
		});
	});
});
