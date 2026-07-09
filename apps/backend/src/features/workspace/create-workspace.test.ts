import { describe, expect, test } from "bun:test";
import {
	db,
	users,
	workspaceMembers,
	workspaces,
} from "@serviceflow/backend/shared/database";
import { and, eq } from "drizzle-orm";
import { createWorkspace } from "./create-workspace";

const ROLLBACK = "TEST_ROLLBACK";

describe("Workspace-Create Integration Tests", () => {
	test("Should create a workspace if all the data is valid", async () => {
		const userId = crypto.randomUUID();

		try {
			await db.transaction(async (tx) => {
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
							eq(workspaceMembers.workspaceId, workspace?.id ?? ""),
						),
					);

				expect(member).toBeDefined();
				expect(member?.role).toBe("owner");
				expect(member?.userId).toBe(userId);
				expect(member?.workspaceId).toBe(workspace?.id);

				throw new Error(ROLLBACK);
			});
		} catch (e) {
			if (e instanceof Error && e.message === ROLLBACK) return;
			throw e;
		}
	});

	test("Should return WORKSPACE_NAME_REQUIRED when name is empty", async () => {
		const userId = crypto.randomUUID();

		try {
			await db.transaction(async (tx) => {
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

				throw new Error(ROLLBACK);
			});
		} catch (e) {
			if (e instanceof Error && e.message === ROLLBACK) return;
			throw e;
		}
	});

	test("Should return WORKSPACE_NAME_REQUIRED when name is whitespace only", async () => {
		const userId = crypto.randomUUID();

		try {
			await db.transaction(async (tx) => {
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

				throw new Error(ROLLBACK);
			});
		} catch (e) {
			if (e instanceof Error && e.message === ROLLBACK) return;
			throw e;
		}
	});

	test("Should return WORKSPACE_NAME_TOO_LONG when name exceeds 250 chars", async () => {
		const userId = crypto.randomUUID();

		try {
			await db.transaction(async (tx) => {
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

				throw new Error(ROLLBACK);
			});
		} catch (e) {
			if (e instanceof Error && e.message === ROLLBACK) return;
			throw e;
		}
	});

	test("Should trim workspace name", async () => {
		const userId = crypto.randomUUID();

		try {
			await db.transaction(async (tx) => {
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

				throw new Error(ROLLBACK);
			});
		} catch (e) {
			if (e instanceof Error && e.message === ROLLBACK) return;
			throw e;
		}
	});

	test("Should assign role as owner to the member", async () => {
		const userId = crypto.randomUUID();

		try {
			await db.transaction(async (tx) => {
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
							eq(workspaceMembers.workspaceId, workspace?.id ?? ""),
						),
					);

				expect(member?.role).toBe("owner");

				throw new Error(ROLLBACK);
			});
		} catch (e) {
			if (e instanceof Error && e.message === ROLLBACK) return;
			throw e;
		}
	});

	test("Should assign a valid UUID to the workspace", async () => {
		const userId = crypto.randomUUID();

		try {
			await db.transaction(async (tx) => {
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

				throw new Error(ROLLBACK);
			});
		} catch (e) {
			if (e instanceof Error && e.message === ROLLBACK) return;
			throw e;
		}
	});

	test("Should set createdAt and updatedAt timestamps", async () => {
		const userId = crypto.randomUUID();

		try {
			await db.transaction(async (tx) => {
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

				throw new Error(ROLLBACK);
			});
		} catch (e) {
			if (e instanceof Error && e.message === ROLLBACK) return;
			throw e;
		}
	});
});
