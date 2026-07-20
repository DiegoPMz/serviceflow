import {
	clients,
	type DatabaseClient,
	type DatabaseType,
} from "@serviceflow/backend/shared/database";
import {
	Cursor,
	type Pagination,
	type SortDirection,
} from "@serviceflow/backend/shared/pagination";
import { and, asc, desc, eq, gt, like, lt, or, type SQL } from "drizzle-orm";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";
import type { ClientCursor, ClientOrderBy } from "../paginated-clients";
import type { Client } from "./client.model";
import type { ClientReadModel } from "./client.read-model";
import type { ClientRepository } from "./client-repository";

export const clientDrizzleRepository = (
	db: DatabaseClient | DatabaseType,
): ClientRepository => ({
	clientExists: async (values: {
		email: string;
		phone: string;
	}): Promise<boolean> => {
		const clientId = await db.query.clients.findFirst({
			where: (clients, { eq, or }) =>
				or(
					eq(clients.email, values.email),
					eq(clients.phoneNumber, values.phone),
				),
			columns: { id: true },
		});

		return !!clientId;
	},

	save: async (model: Client): Promise<void> => {
		await db.insert(clients).values({
			id: model.id,
			email: model.email,
			location: model.location,
			name: model.name,
			phoneNumber: model.phoneNumber,
			workspaceId: model.workspaceId,
			createdAt: model.createdAt,
			updatedAt: model.updatedAt,
		});
	},

	getByIds: async (
		clientId: string,
		workspaceId: string,
	): Promise<Client | null> => {
		const entity = await db.query.clients.findFirst({
			where: (clients, { eq, and }) =>
				and(eq(clients.id, clientId), eq(clients.workspaceId, workspaceId)),
		});

		if (!entity) return null;

		return {
			id: entity.id,
			email: entity.email,
			location: entity.location,
			name: entity.name,
			phoneNumber: entity.phoneNumber,
			workspaceId: entity.workspaceId,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	},

	getAllPaginated: async (params: {
		limit: number;
		cursor?: ClientCursor;
		orderBy: ClientOrderBy;
		direction: SortDirection;
		search?: string;
		workspaceId: string;
	}): Promise<Pagination<ClientReadModel>> => {
		const { limit, direction, orderBy, cursor, search, workspaceId } = params;

		const orderByMapper: Record<ClientOrderBy, SQLiteColumn> = {
			id: clients.id,
			name: clients.name,
			email: clients.email,
			phone: clients.phoneNumber,
		};

		const valueMapper: Record<
			ClientOrderBy,
			(client: ClientReadModel) => string
		> = {
			id: (client) => client.id,
			name: (client) => client.name,
			email: (client) => client.email,
			phone: (client) => client.phoneNumber,
		};

		const dbField = orderByMapper[orderBy];

		const searchCondition = search
			? or(
					like(clients.name, `%${search}%`),
					like(clients.email, `%${search}%`),
					like(clients.phoneNumber, `%${search}%`),
				)
			: undefined;

		const sortCondition = buildSortConditions(dbField);

		const clientsDb = await db
			.select({
				id: clients.id,
				name: clients.name,
				email: clients.email,
				phoneNumber: clients.phoneNumber,
				location: clients.location,
			})
			.from(clients)
			.where(
				and(
					eq(clients.workspaceId, workspaceId),
					searchCondition,
					sortCondition,
				),
			)
			.orderBy(...buildOrderBy(dbField))
			.limit(limit + 1);

		const hasNextPage = clientsDb.length > limit;
		const items = clientsDb.slice(0, limit);
		const lastItem = items.at(-1);

		let nextCursor: string | null = null;

		if (hasNextPage && lastItem) {
			nextCursor = Cursor.encode<ClientCursor>({
				id: lastItem.id,
				orderBy,
				direction,
				value: valueMapper[orderBy](lastItem),
			});
		}

		return {
			items,
			cursor: nextCursor,
			hasNextPage,
		};

		function buildOrderBy(sqlColumn: SQLiteColumn) {
			return direction === "desc"
				? [desc(sqlColumn), desc(clients.id)]
				: [asc(sqlColumn), asc(clients.id)];
		}

		function buildSortConditions(sqlColumn: SQLiteColumn): SQL | undefined {
			if (!cursor) return undefined;
			const value = cursor.value;

			if (direction === "desc")
				return or(
					lt(sqlColumn, value),
					and(eq(sqlColumn, value), lt(clients.id, cursor.id)),
				);

			return or(
				gt(sqlColumn, value),
				and(eq(sqlColumn, value), gt(clients.id, cursor.id)),
			);
		}
	},
});
