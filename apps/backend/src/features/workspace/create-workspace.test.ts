import { describe, expect, test } from "bun:test";
import {
	workspaceMembers,
	workspaces,
} from "@serviceflow/backend/shared/database";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { and, eq } from "drizzle-orm";
import { isValid } from "ulidx";
import { workspaceErrors } from "./common/workspace.errors";
import { PREFIX_REGEX } from "./common/workspace.model";
import { workspaceDrizzleRepository } from "./common/workspace-drizzle-repository";
import { createWorkspace } from "./create-workspace";

const companyDetails = {
	name: "Test Company",
	phone: "+1234567890",
	email: "company@test.com",
	address: "123 Test Street",
};

describe("Workspace-Create Integration Tests", () => {
	test("Should create a workspace if all the data is valid", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			const result = await createWorkspace({
				command: {
					userId,
					workspaceName: "Test Workspace",
					companyDetails,
				},
				repository: workspaceDrizzleRepository(tx),
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

	test("Should assign role as owner to the member", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			await createWorkspace({
				command: { userId, workspaceName: "Owner Test", companyDetails },
				repository: workspaceDrizzleRepository(tx),
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

	test("Should assign a valid Id to the workspace", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			await createWorkspace({
				command: { userId, workspaceName: "UUID Test", companyDetails },
				repository: workspaceDrizzleRepository(tx),
			});

			const [workspace] = await tx
				.select()
				.from(workspaces)
				.where(eq(workspaces.name, "UUID Test"));

			expect(isValid(workspace?.id as string)).toBe(true);
		});
	});

	test("Should set createdAt and updatedAt timestamps", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			await createWorkspace({
				command: { userId, workspaceName: "Timestamp Test", companyDetails },
				repository: workspaceDrizzleRepository(tx),
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
			const userId = await seedUser(tx);

			await createWorkspace({
				command: { userId, workspaceName: "Prefix Test", companyDetails },
				repository: workspaceDrizzleRepository(tx),
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
			const userId = await seedUser(tx);

			const prefixes = new Set<string>();

			for (let i = 0; i < 10; i++) {
				await createWorkspace({
					command: {
						userId,
						workspaceName: `Prefix Test ${i}`,
						companyDetails,
					},
					repository: workspaceDrizzleRepository(tx),
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
			const userId = await seedUser(tx);

			await createWorkspace({
				command: { userId, workspaceName: "Order Count Test", companyDetails },
				repository: workspaceDrizzleRepository(tx),
			});

			const [workspace] = await tx
				.select()
				.from(workspaces)
				.where(eq(workspaces.name, "Order Count Test"));

			expect(workspace).toBeDefined();
			expect(workspace?.orderCount).toBe(0);
		});
	});

	test("Should fail if workspace name is empty", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			const result = await createWorkspace({
				command: { userId, workspaceName: "", companyDetails },
				repository: workspaceDrizzleRepository(tx),
			});

			expect(result.isFailure).toBeTrue();
			expect(result.error.code).toBe(
				workspaceErrors.WORKSPACE_NAME_REQUIRED.code,
			);
		});
	});

	test("Should fail if workspace name exceeds 250 characters", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			const result = await createWorkspace({
				command: {
					userId,
					workspaceName: "A".repeat(251),
					companyDetails,
				},
				repository: workspaceDrizzleRepository(tx),
			});

			expect(result.isFailure).toBeTrue();
			expect(result.error.code).toBe(
				workspaceErrors.WORKSPACE_NAME_TOO_LONG.code,
			);
		});
	});

	test("Should fail if company name is empty", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			const result = await createWorkspace({
				command: {
					userId,
					workspaceName: "Empty Company",
					companyDetails: { ...companyDetails, name: "" },
				},
				repository: workspaceDrizzleRepository(tx),
			});

			expect(result.isFailure).toBeTrue();
			expect(result.error.code).toBe(
				workspaceErrors.WORKSPACE_COMPANY_NAME_REQUIRED.code,
			);
		});
	});

	test("Should fail if company phone is invalid", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			const result = await createWorkspace({
				command: {
					userId,
					workspaceName: "Invalid Phone",
					companyDetails: { ...companyDetails, phone: "invalid" },
				},
				repository: workspaceDrizzleRepository(tx),
			});

			expect(result.isFailure).toBeTrue();
			expect(result.error.code).toBe(
				workspaceErrors.WORKSPACE_COMPANY_PHONE_INVALID.code,
			);
		});
	});

	test("Should fail if company email is invalid", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			const result = await createWorkspace({
				command: {
					userId,
					workspaceName: "Invalid Email",
					companyDetails: { ...companyDetails, email: "invalid" },
				},
				repository: workspaceDrizzleRepository(tx),
			});

			expect(result.isFailure).toBeTrue();
			expect(result.error.code).toBe(
				workspaceErrors.WORKSPACE_COMPANY_EMAIL_INVALID.code,
			);
		});
	});

	test("Should fail if company address is empty", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);

			const result = await createWorkspace({
				command: {
					userId,
					workspaceName: "Empty Address",
					companyDetails: { ...companyDetails, address: "" },
				},
				repository: workspaceDrizzleRepository(tx),
			});

			expect(result.isFailure).toBeTrue();
			expect(result.error.code).toBe(
				workspaceErrors.WORKSPACE_COMPANY_ADDRESS_REQUIRED.code,
			);
		});
	});
});
