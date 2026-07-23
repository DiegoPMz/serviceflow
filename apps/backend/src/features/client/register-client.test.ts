import { describe, expect, test } from "bun:test";
import { clients } from "@serviceflow/backend/shared/database";
import { seedWorkspace } from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { eq } from "drizzle-orm";
import { ulid } from "ulidx";
import { clientDrizzleRepository } from "./common/client-drizzle-repository";
import { registerClientCommandHandler } from "./register-client";

const validCommand = (workspaceId: string) => ({
	name: "Juan Pérez",
	email: `juan-${ulid()}@example.com`,
	phoneNumber: "+5215551234567",
	workspaceId,
	location: "CDMX",
});

describe("Register-Client Integration Tests", () => {
	test("Should register a client successfully and persist it", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const command = validCommand(workspaceId);

			const result = await registerClientCommandHandler({
				command,
				repository: clientDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);

			const [client] = await tx
				.select()
				.from(clients)
				.where(eq(clients.email, command.email));

			expect(client).toBeDefined();
			expect(client?.name).toBe(command.name);
			expect(client?.email).toBe(command.email);
			expect(client?.phoneNumber).toBe(command.phoneNumber);
			expect(client?.location).toBe(command.location);
			expect(client?.workspaceId).toBe(workspaceId);
			expect(client?.createdAt).toBeInstanceOf(Date);
			expect(client?.updatedAt).toBeInstanceOf(Date);
		});
	});

	test("Should return CLIENT_ALREADY_EXISTS when email is already registered", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const command = validCommand(workspaceId);

			await registerClientCommandHandler({
				command,
				repository: clientDrizzleRepository(tx),
			});

			const result = await registerClientCommandHandler({
				command: { ...validCommand(workspaceId), email: command.email },
				repository: clientDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("CLIENT_ALREADY_EXISTS");

			const rows = await tx
				.select()
				.from(clients)
				.where(eq(clients.email, command.email));
			expect(rows.length).toBe(1);
		});
	});

	test("Should return CLIENT_ALREADY_EXISTS when phone is already registered", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const command = validCommand(workspaceId);

			await registerClientCommandHandler({
				command,
				repository: clientDrizzleRepository(tx),
			});

			const result = await registerClientCommandHandler({
				command: {
					...validCommand(workspaceId),
					phoneNumber: command.phoneNumber,
				},
				repository: clientDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("CLIENT_ALREADY_EXISTS");

			const rows = await tx.select().from(clients);
			expect(rows.length).toBe(1);
		});
	});
});
