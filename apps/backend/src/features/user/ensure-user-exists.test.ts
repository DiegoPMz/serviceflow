import { describe, expect, test } from "bun:test";
import { users } from "@serviceflow/backend/shared/database";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import { Created } from "@serviceflow/backend/shared/result";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { eq } from "drizzle-orm";
import { UserErrors } from "./common/user.errors";
import { userDrizzleRepository } from "./common/user-drizzle-repository";
import {
	EnsureUserExistsCommand,
	ensureUserExistsHandler,
} from "./ensure-user-exists";

const validCommand = () =>
	new EnsureUserExistsCommand({
		externalId: "auth0-integration-test",
		email: "integration@example.com",
		name: "Integration",
		lastName: "Test",
	});

describe("User-EnsureUserExists Integration Tests", () => {
	test("Should create a new user when externalId does not exist", async () => {
		await runTestInTransaction(async (tx) => {
			const command = validCommand();

			const result = await ensureUserExistsHandler({
				command: command.value,
				repository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBeTrue();

			const [user] = await tx
				.select()
				.from(users)
				.where(eq(users.externalId, "auth0-integration-test"));

			expect(user).toBeDefined();
			expect(user?.externalId).toBe("auth0-integration-test");
			expect(user?.email).toBe("integration@example.com");
			expect(user?.name).toBe("Integration");
			expect(user?.lastName).toBe("Test");
			expect(user?.createdAt).toBeInstanceOf(Date);
			expect(user?.updatedAt).toBeInstanceOf(Date);
		});
	});

	test("Should return Created if user already exists", async () => {
		await runTestInTransaction(async (tx) => {
			await seedUser(tx, { externalId: "auth0-existing" });

			const command = new EnsureUserExistsCommand({
				externalId: "auth0-existing",
				email: "existing@example.com",
				name: "Existing",
			});

			const result = await ensureUserExistsHandler({
				command: command.value,
				repository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBeTrue();
			expect(result.value).toBeInstanceOf(Created);

			const usersFound = await tx
				.select()
				.from(users)
				.where(eq(users.externalId, "auth0-existing"));

			expect(usersFound).toHaveLength(1);
		});
	});

	test("Should fail when externalId is missing", async () => {
		await runTestInTransaction(async (tx) => {
			const command = new EnsureUserExistsCommand({
				externalId: "",
				email: "test@example.com",
				name: "Test",
			});

			const result = await ensureUserExistsHandler({
				command: command.value,
				repository: userDrizzleRepository(tx),
			});

			expect(result.isFailure).toBeTrue();
			expect(result.error.code).toBe(UserErrors.USER_EXTERNAL_ID_REQUIRED.code);
		});
	});

	test("Should fail when email is invalid", async () => {
		await runTestInTransaction(async (tx) => {
			const command = new EnsureUserExistsCommand({
				externalId: "auth0-bad-email",
				email: "not-an-email",
				name: "Test",
			});

			const result = await ensureUserExistsHandler({
				command: command.value,
				repository: userDrizzleRepository(tx),
			});

			expect(result.isFailure).toBeTrue();
			expect(result.error.code).toBe(UserErrors.USER_EMAIL_INVALID.code);
		});
	});

	test("Should fail when email is missing", async () => {
		await runTestInTransaction(async (tx) => {
			const command = new EnsureUserExistsCommand({
				externalId: "auth0-no-email",
				email: "",
				name: "Test",
			});

			const result = await ensureUserExistsHandler({
				command: command.value,
				repository: userDrizzleRepository(tx),
			});

			expect(result.isFailure).toBeTrue();
			expect(result.error.code).toBe(UserErrors.USER_EMAIL_REQUIRED.code);
		});
	});

	test("Should fail when name is missing", async () => {
		await runTestInTransaction(async (tx) => {
			const command = new EnsureUserExistsCommand({
				externalId: "auth0-no-name",
				email: "test@example.com",
				name: "",
			});

			const result = await ensureUserExistsHandler({
				command: command.value,
				repository: userDrizzleRepository(tx),
			});

			expect(result.isFailure).toBeTrue();
			expect(result.error.code).toBe(UserErrors.USER_NAME_REQUIRED.code);
		});
	});

	test("Should persist user with all optional fields", async () => {
		await runTestInTransaction(async (tx) => {
			const command = new EnsureUserExistsCommand({
				externalId: "auth0-full",
				email: "full@example.com",
				name: "Full",
				lastName: "User",
				phone: "+5215551234567",
				pictureUrl: "https://example.com/photo.jpg",
			});

			const result = await ensureUserExistsHandler({
				command: command.value,
				repository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBeTrue();

			const [user] = await tx
				.select()
				.from(users)
				.where(eq(users.externalId, "auth0-full"));

			expect(user?.phone).toBe("+5215551234567");
			expect(user?.pictureUrl).toBe("https://example.com/photo.jpg");
			expect(user?.lastName).toBe("User");
		});
	});

	test("Should persist user with null optional fields when not provided", async () => {
		await runTestInTransaction(async (tx) => {
			const command = new EnsureUserExistsCommand({
				externalId: "auth0-minimal",
				email: "minimal@example.com",
				name: "Minimal",
			});

			const result = await ensureUserExistsHandler({
				command: command.value,
				repository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBeTrue();

			const [user] = await tx
				.select()
				.from(users)
				.where(eq(users.externalId, "auth0-minimal"));

			expect(user?.phone).toBeNull();
			expect(user?.pictureUrl).toBeNull();
			expect(user?.lastName).toBeNull();
		});
	});

	test("Should trim fields when creating user", async () => {
		await runTestInTransaction(async (tx) => {
			const command = new EnsureUserExistsCommand({
				externalId: "  auth0-trimmed  ",
				email: "  trimmed@example.com  ",
				name: "  Trimmed  ",
				lastName: "  User  ",
				pictureUrl: "  https://example.com/photo.jpg  ",
			});

			const result = await ensureUserExistsHandler({
				command: command.value,
				repository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBeTrue();

			const [user] = await tx
				.select()
				.from(users)
				.where(eq(users.externalId, "auth0-trimmed"));

			expect(user?.externalId).toBe("auth0-trimmed");
			expect(user?.email).toBe("trimmed@example.com");
			expect(user?.name).toBe("Trimmed");
			expect(user?.lastName).toBe("User");
			expect(user?.pictureUrl).toBe("https://example.com/photo.jpg");
		});
	});
});
