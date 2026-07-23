import { ulid } from "ulidx";
import type { DatabaseClient, DatabaseType } from "../client";
import { users } from "../schema";

export const seedUser = async (
	tx: DatabaseClient | DatabaseType,
	overrides?: Partial<typeof users.$inferInsert>,
) => {
	const userId = ulid();
	const now = new Date();
	await tx.insert(users).values({
		id: userId,
		name: "Test User",
		email: `user-${userId}@example.com`,
		externalId: `auth0-${userId}`,
		createdAt: now,
		updatedAt: now,
		lastName: "Perez",
		phone: `+52155${Math.floor(10000000 + Math.random() * 90000000)}`,
		pictureUrl: null,
		...overrides,
	});

	return userId;
};
