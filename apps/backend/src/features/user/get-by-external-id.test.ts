import { describe, expect, test } from "bun:test";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { UserErrors } from "./common/user.errors";
import { userDrizzleRepository } from "./common/user-drizzle-repository";
import {
	GetUserByExternalIdQuery,
	getUserByExternalIdHandler,
} from "./get-by-external-id";

describe("User-GetByExternalId Integration Tests", () => {
	test("Should return a userDto when externalId exists", async () => {
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

			const userResult = await getUserByExternalIdHandler({
				query: query.value,
				repository: userDrizzleRepository(tx),
			});

			const user = userResult.value;

			expect(userResult.isSuccess).toBeTrue();
			expect(user?.id).toBe(userId);
			expect(user?.name).toBe("Find Me");
			expect(user?.email).toBe("findme@example.com");
			expect(user?.lastName).toBe("User");
			expect(user?.pictureUrl).toBe("https://example.com/pic.jpg");
		});
	});

	test("Should return UserErrors.USER_NOT_FOUND when externalId does not exist", async () => {
		await runTestInTransaction(async (tx) => {
			const query = new GetUserByExternalIdQuery({
				externalId: "auth0-nonexistent",
			});

			const user = await getUserByExternalIdHandler({
				query: query.value,
				repository: userDrizzleRepository(tx),
			});

			expect(user.isFailure).toBeTrue();
			expect(user.error).toBe(UserErrors.USER_NOT_FOUND);
		});
	});
});
