import {
	type DatabaseClient,
	type DatabaseType,
	workspaceMembers,
	workspaces,
} from "@serviceflow/backend/shared/database";
import {
	Cursor,
	type Pagination,
	type SortDirection,
} from "@serviceflow/backend/shared/pagination";
import { and, asc, desc, eq, gt, like, lt, or, type SQL } from "drizzle-orm";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";
import type {
	WorkspaceCursor,
	WorkspaceOrderBy,
} from "../paginated-workspaces";
import { Workspace } from "./workspace.model";
import type { WorkspaceReadModel } from "./workspace.read-model";
import type { WorkspaceRepository } from "./workspace-repository";

export const workspaceDrizzleRepository = (
	db: DatabaseClient | DatabaseType,
): WorkspaceRepository => ({
	save: async (model: Workspace): Promise<void> => {
		await db.insert(workspaces).values({
			id: model.id,
			name: model.name,
			prefix: model.prefix,
			orderCount: model.orderCount,
			companyName: model.company.name,
			companyEmail: model.company.email,
			companyPhone: model.company.phone,
			companyAddress: model.company.address,
			companyLogoUrl: model.company.logoUrl,
			createdAt: model.createdAt,
			updatedAt: model.updatedAt,
		});

		await db.insert(workspaceMembers).values({
			userId: model.ownerId,
			role: "owner",
			workspaceId: model.id,
		});
	},

	update: async (model: Workspace): Promise<void> => {
		await db
			.update(workspaces)
			.set({
				orderCount: model.orderCount,
				name: model.name,
				companyLogoUrl: model.company.logoUrl,
				updatedAt: model.updatedAt,
			})
			.where(eq(workspaces.id, model.id));
	},

	getById: async (workspaceId: string): Promise<Workspace | null> => {
		const [workspace] = await db
			.select({
				id: workspaces.id,
				name: workspaces.name,
				createdAt: workspaces.createdAt,
				updatedAt: workspaces.updatedAt,
				orderCount: workspaces.orderCount,
				prefix: workspaces.prefix,
				ownerId: workspaceMembers.userId,
				companyName: workspaces.companyName,
				companyEmail: workspaces.companyEmail,
				companyPhone: workspaces.companyPhone,
				companyAddress: workspaces.companyAddress,
				companyLogoUrl: workspaces.companyLogoUrl,
			})
			.from(workspaces)
			.innerJoin(
				workspaceMembers,
				eq(workspaceMembers.workspaceId, workspaces.id),
			)
			.where(eq(workspaces.id, workspaceId));

		if (!workspace) return null;

		return Workspace.reconstitute({
			id: workspace.id,
			name: workspace.name,
			createdAt: workspace.createdAt,
			updatedAt: workspace.updatedAt,
			orderCount: workspace.orderCount,
			prefix: workspace.prefix,
			ownerId: workspace.ownerId,
			workspaceCompany: {
				name: workspace.companyName,
				phone: workspace.companyPhone,
				email: workspace.companyEmail,
				address: workspace.companyAddress,
				logoUrl: workspace.companyLogoUrl,
			},
		});
	},
	getAllPaginated: async ({
		orderBy,
		direction,
		limit,
		cursor,
		search,
		userId,
	}: {
		limit: number;
		cursor?: WorkspaceCursor;
		orderBy: WorkspaceOrderBy;
		direction: SortDirection;
		search?: string;
		userId: string;
	}): Promise<Pagination<WorkspaceReadModel>> => {
		const orderByMapper: Record<WorkspaceOrderBy, SQLiteColumn> = {
			name: workspaces.name,
			id: workspaces.id,
			updatedAt: workspaces.updatedAt,
		};

		const valueMapper: Record<
			WorkspaceOrderBy,
			(workspace: WorkspaceReadModel) => string | Date
		> = {
			name: (workspace) => workspace.name,
			id: (workspace) => workspace.id,
			updatedAt: (workspace) => workspace.updatedAt,
		};

		const dbField = orderByMapper[orderBy];

		const searchCondition = search
			? or(like(workspaces.name, `%${search}%`))
			: undefined;

		const sortCondition = buildSortConditions();

		const workspacesDb = await db
			.select({
				id: workspaces.id,
				name: workspaces.name,
				createdAt: workspaces.createdAt,
				updatedAt: workspaces.updatedAt,
			})
			.from(workspaces)
			.innerJoin(
				workspaceMembers,
				and(
					eq(workspaceMembers.workspaceId, workspaces.id),
					eq(workspaceMembers.userId, userId),
				),
			)
			.where(and(searchCondition, sortCondition))
			.orderBy(...buildOrderBy())
			.limit(limit + 1);

		const hasNextPage = workspacesDb.length > limit;
		const items = workspacesDb.slice(0, limit);
		const lastItem = items.at(-1);

		let nextCursor: string | null = null;

		if (hasNextPage && lastItem) {
			nextCursor = Cursor.encode<WorkspaceCursor>({
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

		function buildOrderBy(): SQL[] {
			return direction === "desc"
				? [desc(dbField), desc(workspaces.id)]
				: [asc(dbField), asc(workspaces.id)];
		}

		function buildSortConditions(): SQL | undefined {
			if (!cursor) return undefined;

			const value = cursor.value;

			if (direction === "desc") {
				return or(
					lt(dbField, value),
					and(eq(dbField, value), lt(workspaces.id, cursor.id)),
				);
			}

			return or(
				gt(dbField, value),
				and(eq(dbField, value), gt(workspaces.id, cursor.id)),
			);
		}
	},
});
