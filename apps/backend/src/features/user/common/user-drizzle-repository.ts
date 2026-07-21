import {
	type DatabaseClient,
	type DatabaseType,
	users,
} from "@serviceflow/backend/shared/database";
import type { User } from "./user.model";
import type { UserRepository } from "./user-repository";

export const userDrizzleRepository = (
	db: DatabaseClient | DatabaseType,
): UserRepository => ({
	save: async (user: User): Promise<void> => {
		await db.insert(users).values({
			id: user.id,
			externalId: user.externalId,
			phone: user.phone,
			lastName: user.lastName,
			email: user.email,
			name: user.name,
			pictureUrl: user.pictureUrl,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		});
	},
	getById: async (id: string): Promise<User | null> => {
		const entity = await db.query.users.findFirst({
			where: (users, { eq }) => eq(users.id, id),
		});

		if (!entity) return null;

		return {
			id: entity.id,
			externalId: entity.externalId,
			email: entity.email,
			name: entity.name,
			pictureUrl: entity.pictureUrl,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			lastName: entity.lastName,
			phone: entity.phone,
		};
	},
});
