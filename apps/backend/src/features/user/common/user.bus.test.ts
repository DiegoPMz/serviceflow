import { describe, expect, test } from "bun:test";
import { db, users } from "@serviceflow/backend/shared/database";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import { eq } from "drizzle-orm";
import { EnsureUserExistsCommand } from "../ensure-user-exists";
import { GetUserByExternalIdQuery } from "../get-by-external-id";
import { userBus } from "./user.bus";

describe("User-Bus Integration Tests", () => {
	test("Should create a user when EnsureUserExistsCommand is sent for a new user", async () => {
		const externalId = `auth0-bus-create-${Date.now()}`;

		const result = await userBus(
			new EnsureUserExistsCommand({
				externalId,
				email: "bus-create@example.com",
				name: "Bus Create",
			}),
		);

		expect(result.isSuccess).toBeTrue();

		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.externalId, externalId));

		expect(user).toBeDefined();
		expect(user?.name).toBe("Bus Create");

		await db.delete(users).where(eq(users.externalId, externalId));
	});

	test("Should return Created when EnsureUserExistsCommand is sent for an existing user", async () => {
		const externalId = `auth0-bus-existing-${Date.now()}`;
		await seedUser(db, { externalId });

		const result = await userBus(
			new EnsureUserExistsCommand({
				externalId,
				email: "bus-existing@example.com",
				name: "Bus Existing",
			}),
		);

		expect(result.isSuccess).toBeTrue();

		const usersFound = await db
			.select()
			.from(users)
			.where(eq(users.externalId, externalId));

		expect(usersFound).toHaveLength(1);

		await db.delete(users).where(eq(users.externalId, externalId));
	});

	test("Should return user when GetUserByExternalIdQuery is sent for an existing user", async () => {
		const externalId = `auth0-bus-query-${Date.now()}`;
		await seedUser(db, {
			externalId,
			name: "Bus Query",
			email: "bus-query@example.com",
			lastName: "User",
		});

		const user = await userBus(
			new GetUserByExternalIdQuery({ externalId }),
		);

		expect(user).not.toBeNull();
		expect(user?.externalId).toBe(externalId);
		expect(user?.name).toBe("Bus Query");

		await db.delete(users).where(eq(users.externalId, externalId));
	});

	test("Should return null when GetUserByExternalIdQuery is sent for a non-existent user", async () => {
		const user = await userBus(
			new GetUserByExternalIdQuery({
				externalId: "auth0-bus-nonexistent",
			}),
		);

		expect(user).toBeNull();
	});

	test("Should throw for unrecognized command", async () => {
		expect(() =>
			userBus({} as EnsureUserExistsCommand),
		).toThrow("Comando no reconocido");
	});
});
