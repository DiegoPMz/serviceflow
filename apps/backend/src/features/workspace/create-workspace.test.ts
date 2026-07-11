import { describe, expect, test } from "bun:test";
import {
	users,
	workspaceMembers,
	workspaces,
} from "@serviceflow/backend/shared/database";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { and, eq } from "drizzle-orm";
import { PREFIX_REGEX } from "./common/workspace.model";
import { createWorkspace } from "./create-workspace";

describe("Workspace-Create Integration Tests", () => {
	test("Should create a workspace if all the data is valid", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = crypto.randomUUID();

			await tx.insert(users).values({
				id: userId,
				name: "Test User",
				email: `test-${userId}@example.com`,
			});

			const result = await createWorkspace({
				command: { userId, workspaceName: "Test Workspace" },
				dbClient: tx,
			});

			expect(result.isSuccess).toBeTrue();

			const [workspace] = await tx
				.select()
				.from(workspaces)
				.where(eq(workspaces.name, "Test Workspace"));

			expect(workspace).toBeDefined();
			expect(workspace?.name).toBe("Test Workspace");

			const [member] = await tx
				.select()
				.from(workspaceMembers)
				.where(
					and(
						eq(workspaceMembers.userId, userId),
						eq(workspaceMembers.workspaceId, workspace?.id as string),
					),
				);

			expect(member).toBeDefined();
			expect(member?.role).toBe("owner");
			expect(member?.userId).toBe(userId);
			expect(member?.workspaceId).toBe(workspace?.id);
		});
	});

	test("Should return WORKSPACE_NAME_REQUIRED when name is empty", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = crypto.randomUUID();

			await tx.insert(users).values({
				id: userId,
				name: "Test User",
				email: `test-${userId}@example.com`,
			});

			const result = await createWorkspace({
				command: { userId, workspaceName: "" },
				dbClient: tx,
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("WORKSPACE_NAME_REQUIRED");

			const rows = await tx.select().from(workspaces);
			expect(rows.length).toBe(0);
		});
	});

	test("Should return WORKSPACE_NAME_REQUIRED when name is whitespace only", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = crypto.randomUUID();

			await tx.insert(users).values({
				id: userId,
				name: "Test User",
				email: `test-${userId}@example.com`,
			});

			const result = await createWorkspace({
				command: { userId, workspaceName: "   " },
				dbClient: tx,
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("WORKSPACE_NAME_REQUIRED");

			const rows = await tx.select().from(workspaces);
			expect(rows.length).toBe(0);
		});
	});

	test("Should return WORKSPACE_NAME_TOO_LONG when name exceeds 250 chars", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = crypto.randomUUID();

			await tx.insert(users).values({
				id: userId,
				name: "Test User",
				email: `test-${userId}@example.com`,
			});

			const result = await createWorkspace({
				command: { userId, workspaceName: "a".repeat(251) },
				dbClient: tx,
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("WORKSPACE_NAME_TOO_LONG");

			const rows = await tx.select().from(workspaces);
			expect(rows.length).toBe(0);
		});
	});

	test("Should trim workspace name", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = crypto.randomUUID();

			await tx.insert(users).values({
				id: userId,
				name: "Test User",
				email: `test-${userId}@example.com`,
			});

			const result = await createWorkspace({
				command: { userId, workspaceName: "  Trimmed  " },
				dbClient: tx,
			});

			expect(result.isSuccess).toBe(true);

			const [workspace] = await tx
				.select()
				.from(workspaces)
				.where(eq(workspaces.name, "Trimmed"));

			expect(workspace).toBeDefined();
			expect(workspace?.name).toBe("Trimmed");
		});
	});

	test("Should assign role as owner to the member", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = crypto.randomUUID();

			await tx.insert(users).values({
				id: userId,
				name: "Test User",
				email: `test-${userId}@example.com`,
			});

			await createWorkspace({
				command: { userId, workspaceName: "Owner Test" },
				dbClient: tx,
			});

			const [workspace] = await tx
				.select()
				.from(workspaces)
				.where(eq(workspaces.name, "Owner Test"));

			const [member] = await tx
				.select()
				.from(workspaceMembers)
				.where(
					and(
						eq(workspaceMembers.userId, userId),
						eq(workspaceMembers.workspaceId, workspace?.id as string),
					),
				);

			expect(member?.role).toBe("owner");
		});
	});

	test("Should assign a valid UUID to the workspace", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = crypto.randomUUID();

			await tx.insert(users).values({
				id: userId,
				name: "Test User",
				email: `test-${userId}@example.com`,
			});

			await createWorkspace({
				command: { userId, workspaceName: "UUID Test" },
				dbClient: tx,
			});

			const [workspace] = await tx
				.select()
				.from(workspaces)
				.where(eq(workspaces.name, "UUID Test"));

			const uuidRegex =
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
			expect(uuidRegex.test(workspace?.id ?? "")).toBe(true);
		});
	});

	test("Should set createdAt and updatedAt timestamps", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = crypto.randomUUID();

			await tx.insert(users).values({
				id: userId,
				name: "Test User",
				email: `test-${userId}@example.com`,
			});

			await createWorkspace({
				command: { userId, workspaceName: "Timestamp Test" },
				dbClient: tx,
			});

			const [workspace] = await tx
				.select()
				.from(workspaces)
				.where(eq(workspaces.name, "Timestamp Test"));

			expect(workspace?.createdAt).toBeInstanceOf(Date);
			expect(workspace?.updatedAt).toBeInstanceOf(Date);
		});
	});

	test("Should generate a prefix with 4-6 uppercase letters when not provided", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = crypto.randomUUID();

			await tx.insert(users).values({
				id: userId,
				name: "Test User",
				email: `test-${userId}@example.com`,
			});

			await createWorkspace({
				command: { userId, workspaceName: "Prefix Test" },
				dbClient: tx,
			});

			const [workspace] = await tx
				.select()
				.from(workspaces)
				.where(eq(workspaces.name, "Prefix Test"));

			expect(workspace).toBeDefined();
			expect(workspace?.prefix).toBeDefined();
			expect(PREFIX_REGEX.test(workspace?.prefix as string)).toBe(true);
		});
	});

	test("Should generate different prefixes for multiple workspaces", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = crypto.randomUUID();

			await tx.insert(users).values({
				id: userId,
				name: "Test User",
				email: `test-${userId}@example.com`,
			});

			const prefixes = new Set<string>();

			for (let i = 0; i < 10; i++) {
				await createWorkspace({
					command: { userId, workspaceName: `Prefix Test ${i}` },
					dbClient: tx,
				});

				const [workspace] = await tx
					.select()
					.from(workspaces)
					.where(eq(workspaces.name, `Prefix Test ${i}`));

				expect(workspace).toBeDefined();
				expect(PREFIX_REGEX.test(workspace?.prefix as string)).toBe(true);
				prefixes.add(workspace?.prefix ?? "");
			}

			expect(prefixes.size).toBe(10);
		});
	});

	test("Should set orderCount to 0 by default", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = crypto.randomUUID();

			await tx.insert(users).values({
				id: userId,
				name: "Test User",
				email: `test-${userId}@example.com`,
			});

			await createWorkspace({
				command: { userId, workspaceName: "Order Count Test" },
				dbClient: tx,
			});

			const [workspace] = await tx
				.select()
				.from(workspaces)
				.where(eq(workspaces.name, "Order Count Test"));

			expect(workspace).toBeDefined();
			expect(workspace?.orderCount).toBe(0);
		});
	});
});
