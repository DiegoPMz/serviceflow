import {
	type DatabaseClient,
	type DatabaseType,
	users,
	workspaceMembers,
} from "@serviceflow/backend/shared/database";
import {
	Cursor,
	type Pagination,
	type SortDirection,
} from "@serviceflow/backend/shared/pagination";
import { and, asc, desc, eq, gt, like, lt, or, type SQL } from "drizzle-orm";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";
import type { WorkspaceRole } from "../../workspace/common/workspace-member.model";
import type { UserCursor, UserOrderBy } from "../paginated-users";
import type { User } from "./user.model";
import type { UserDetailsReadModel } from "./user-details.read-model";
import type { UserRepository } from "./user-repository";

interface UserDetailsReadModelData {
	id: string;
	role: WorkspaceRole;
	email: string;
	name: string;
	lastName: string | null;
	pictureUrl: string | null;
	phone: string | null;
	createdAt: Date;
	updatedAt: Date;
}

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

	transaction: async <R>(
		fn: (txRepo: UserRepository) => Promise<R>,
	): Promise<R> => {
		return await db.transaction(async (tx) => {
			const txRepo = userDrizzleRepository(tx);
			return await fn(txRepo);
		});
	},

	getPictureUrlById: async (id: string): Promise<string | null> => {
		const entity = await db.query.users.findFirst({
			where: (users, { eq }) => eq(users.id, id),
			columns: {
				pictureUrl: true,
			},
		});

		return entity ? entity.pictureUrl : null;
	},

	getAllPaginated: async ({
		limit,
		cursor,
		orderBy,
		direction,
		search,
		workspaceId,
	}: {
		limit: number;
		cursor?: UserCursor;
		orderBy: UserOrderBy;
		direction: SortDirection;
		search?: string;
		workspaceId: string;
	}): Promise<Pagination<UserDetailsReadModel>> => {
		const orderByMapper: Record<UserOrderBy, SQLiteColumn> = {
			id: users.id,
			name: users.name,
			lastName: users.lastName,
			email: users.email,
			createdAt: users.createdAt,
			updatedAt: users.updatedAt,
		};

		const valueMapper: Record<
			UserOrderBy,
			(user: UserDetailsReadModelData) => string | number
		> = {
			id: (user) => user.id,
			name: (user) => user.name,
			lastName: (user) => user.lastName ?? "",
			email: (user) => user.email,
			createdAt: (user) => user.createdAt.getTime(),
			updatedAt: (user) => user.updatedAt.getTime(),
		};

		const dbField = orderByMapper[orderBy];

		const searchCondition = search
			? or(
					like(users.name, `%${search}%`),
					like(users.lastName, `%${search}%`),
					like(users.email, `%${search}%`),
					like(users.phone, `%${search}%`),
				)
			: undefined;

		const sortCondition = buildSortConditions();

		const usersDb: UserDetailsReadModelData[] = await db
			.select({
				id: users.id,
				role: workspaceMembers.role,
				email: users.email,
				name: users.name,
				lastName: users.lastName,
				pictureUrl: users.pictureUrl,
				phone: users.phone,
				createdAt: users.createdAt,
				updatedAt: users.updatedAt,
			})
			.from(users)
			.innerJoin(workspaceMembers, eq(workspaceMembers.userId, users.id))
			.where(
				and(
					eq(workspaceMembers.workspaceId, workspaceId),
					searchCondition,
					sortCondition,
				),
			)
			.orderBy(...buildOrderBy())
			.limit(limit + 1);

		const hasNextPage = usersDb.length > limit;
		const items = usersDb.slice(0, limit);
		const lastItem = items.at(-1);

		let nextCursor: string | null = null;

		if (hasNextPage && lastItem) {
			nextCursor = Cursor.encode<UserCursor>({
				id: lastItem.id,
				orderBy,
				direction,
				value: valueMapper[orderBy](lastItem),
			});
		}

		return {
			items: items.map(({ createdAt, updatedAt, lastName, ...user }) => ({
				...user,
				lastName: lastName ?? "",
			})),
			cursor: nextCursor,
			hasNextPage,
		};

		function buildOrderBy(): SQL[] {
			return direction === "desc"
				? [desc(dbField), desc(users.id)]
				: [asc(dbField), asc(users.id)];
		}

		function buildSortConditions(): SQL | undefined {
			if (!cursor) return undefined;

			const value = DATE_FIELDS.has(orderBy)
				? new Date(cursor.value as number)
				: cursor.value;

			if (direction === "desc") {
				return or(
					lt(dbField, value),
					and(eq(dbField, value), lt(users.id, cursor.id)),
				);
			}

			return or(
				gt(dbField, value),
				and(eq(dbField, value), gt(users.id, cursor.id)),
			);
		}
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

const DATE_FIELDS: ReadonlySet<UserOrderBy> = new Set([
	"createdAt",
	"updatedAt",
]);
