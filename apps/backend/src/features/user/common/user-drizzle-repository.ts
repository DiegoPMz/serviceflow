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
		await db.insert(users).values({ ...userMapper.toEntity(user) });
	},

	getById: async (id: string): Promise<User | null> => {
		const entity = await db.query.users.findFirst({
			where: (users, { eq }) => eq(users.id, id),
		});

		if (!entity) return null;
		return userMapper.toModel(entity);
	},

	getByExternalId: async (externalId: string): Promise<User | null> => {
		const entity = await db.query.users.findFirst({
			where: (users, { eq }) => eq(users.externalId, externalId),
		});

		if (!entity) return null;
		return userMapper.toModel(entity);
	},
});

const userMapper = {
	toModel: (entity: typeof users.$inferSelect): User => ({
		id: entity.id,
		externalId: entity.externalId,
		email: entity.email,
		name: entity.name,
		pictureUrl: entity.pictureUrl,
		createdAt: entity.createdAt,
		updatedAt: entity.updatedAt,
		lastName: entity.lastName,
		phone: entity.phone,
	}),
	toEntity: (model: User): typeof users.$inferInsert => ({
		id: model.id,
		externalId: model.externalId,
		phone: model.phone,
		lastName: model.lastName,
		email: model.email,
		name: model.name,
		pictureUrl: model.pictureUrl,
		createdAt: model.createdAt,
		updatedAt: model.updatedAt,
	}),
};
