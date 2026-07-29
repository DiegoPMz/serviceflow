import { describe, expect, test } from "bun:test";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { userDrizzleRepository } from "./common/user-drizzle-repository";
import {
	GetUserByExternalIdQuery,
	getUserByExternalIdHandler,
} from "./get-by-external-id";

describe("User-GetByExternalId Integration Tests", () => {
	test("Should return user when externalId exists", async () => {
		await runTestInTransaction(async (tx) => {
			const externalId = "auth0-get-by-id";
			const userId = await seedUser(tx, {
				externalId,
				name: "Find Me",
				email: "findme@example.com",
				lastName: "User",
				phone: "+5215551234567",
				pictureUrl: "https://example.com/pic.jpg",
			});

			const query = new GetUserByExternalIdQuery({ externalId });

			const user = await getUserByExternalIdHandler({
				query: query.value,
				repository: userDrizzleRepository(tx),
			});

			expect(user).not.toBeNull();
			expect(user?.id).toBe(userId);
			expect(user?.externalId).toBe(externalId);
			expect(user?.name).toBe("Find Me");
			expect(user?.email).toBe("findme@example.com");
			expect(user?.lastName).toBe("User");
			expect(user?.phone).toBe("+5215551234567");
			expect(user?.pictureUrl).toBe("https://example.com/pic.jpg");
			expect(user?.createdAt).toBeInstanceOf(Date);
			expect(user?.updatedAt).toBeInstanceOf(Date);
		});
	});

	test("Should return null when externalId does not exist", async () => {
		await runTestInTransaction(async (tx) => {
			const query = new GetUserByExternalIdQuery({
				externalId: "auth0-nonexistent",
			});

			const user = await getUserByExternalIdHandler({
				query: query.value,
				repository: userDrizzleRepository(tx),
			});

			expect(user).toBeNull();
		});
	});

	test("Should return user with null optional fields when not set", async () => {
		await runTestInTransaction(async (tx) => {
			const externalId = "auth0-no-optionals";
			await seedUser(tx, {
				externalId,
				name: "No Optionals",
				email: "noopt@example.com",
				lastName: null,
				phone: null,
				pictureUrl: null,
			});

			const query = new GetUserByExternalIdQuery({ externalId });

			const user = await getUserByExternalIdHandler({
				query: query.value,
				repository: userDrizzleRepository(tx),
			});

			expect(user).not.toBeNull();
			expect(user?.lastName).toBeNull();
			expect(user?.phone).toBeNull();
			expect(user?.pictureUrl).toBeNull();
		});
	});
});
