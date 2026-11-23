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
import type {
	WorkspaceMemberCursor,
	WorkspaceMemberOrderBy,
} from "../paginated-workspace-members";
import { WorkspaceMember, type WorkspaceRole } from "./workspace-member.model";
import type { WorkspaceMemberReadModel } from "./workspace-member.read-model";
import type { WorkspaceMemberRepository } from "./workspace-member.repository";

interface WorkspaceMemberRow {
	userId: string;
	name: string;
	lastName: string | null;
	email: string;
	pictureUrl: string | null;
	role: WorkspaceRole;
	joinedAt: Date;
}

export const workspaceMemberDrizzleRepository = (
	db: DatabaseClient | DatabaseType,
): WorkspaceMemberRepository => ({
	existsByEmailAndWorkspace: async (
		email: string,
		workspaceId: string,
	): Promise<boolean> => {
		const memberships = await db
			.select({ userId: workspaceMembers.userId })
			.from(workspaceMembers)
			.innerJoin(users, eq(workspaceMembers.userId, users.id))
			.where(
				and(
					eq(users.email, email),
					eq(workspaceMembers.workspaceId, workspaceId),
				),
			)
			.limit(1);

		return memberships.length > 0;
	},

	addMember: async (member: WorkspaceMember): Promise<void> => {
		await db.insert(workspaceMembers).values({
			workspaceId: member.workspaceId,
			userId: member.userId,
			role: member.role,
			joinedAt: member.joinedAt,
			updatedAt: member.updatedAt,
		});
	},

	findMembership: async (values: {
		userId: string;
		workspaceId: string;
	}): Promise<WorkspaceMember | null> => {
		const member = await db
			.select({
				workspaceId: workspaceMembers.workspaceId,
				userId: workspaceMembers.userId,
				role: workspaceMembers.role,
				joinedAt: workspaceMembers.joinedAt,
				updatedAt: workspaceMembers.updatedAt,
			})
			.from(workspaceMembers)
			.where(
				and(
					eq(workspaceMembers.userId, values.userId),
					eq(workspaceMembers.workspaceId, values.workspaceId),
				),
			)
			.get();

		if (!member) return null;
		return WorkspaceMember.reconstitute(member);
	},

	update: async (member: WorkspaceMember): Promise<void> => {
		await db
			.update(workspaceMembers)
			.set({
				role: member.role,
				updatedAt: member.updatedAt,
			})
			.where(
				and(
					eq(workspaceMembers.userId, member.userId),
					eq(workspaceMembers.workspaceId, member.workspaceId),
				),
			);
	},

	remove: async (member: WorkspaceMember): Promise<void> => {
		await db
			.delete(workspaceMembers)
			.where(
				and(
					eq(workspaceMembers.userId, member.userId),
					eq(workspaceMembers.workspaceId, member.workspaceId),
				),
			);
	},

	getAllPaginated: async ({
		workspaceId,
		limit,
		cursor,
		orderBy,
		direction,
		search,
	}: {
		workspaceId: string;
		limit: number;
		cursor?: WorkspaceMemberCursor;
		orderBy: WorkspaceMemberOrderBy;
		direction: SortDirection;
		search?: string;
	}): Promise<Pagination<WorkspaceMemberReadModel>> => {
		const orderByMapper: Record<WorkspaceMemberOrderBy, SQLiteColumn> = {
			joinedAt: workspaceMembers.joinedAt,
			name: users.name,
			email: users.email,
		};

		const valueMapper: Record<
			WorkspaceMemberOrderBy,
			(member: WorkspaceMemberRow) => string | number
		> = {
			joinedAt: (member) => member.joinedAt.getTime(),
			name: (member) => member.name,
			email: (member) => member.email,
		};

		const dbField = orderByMapper[orderBy];

		const searchCondition = search
			? or(
					like(users.name, `%${search}%`),
					like(users.lastName, `%${search}%`),
					like(users.email, `%${search}%`),
				)
			: undefined;

		const sortCondition = buildSortConditions();

		const membersDb: WorkspaceMemberRow[] = await db
			.select({
				userId: workspaceMembers.userId,
				name: users.name,
				lastName: users.lastName,
				email: users.email,
				pictureUrl: users.pictureUrl,
				role: workspaceMembers.role,
				joinedAt: workspaceMembers.joinedAt,
			})
			.from(workspaceMembers)
			.innerJoin(users, eq(workspaceMembers.userId, users.id))
			.where(
				and(
					eq(workspaceMembers.workspaceId, workspaceId),
					searchCondition,
					sortCondition,
				),
			)
			.orderBy(...buildOrderBy())
			.limit(limit + 1);

		const hasNextPage = membersDb.length > limit;
		const items = membersDb.slice(0, limit);
		const lastItem = items.at(-1);

		let nextCursor: string | null = null;

		if (hasNextPage && lastItem) {
			nextCursor = Cursor.encode<WorkspaceMemberCursor>({
				workspaceId,
				id: lastItem.userId,
				orderBy,
				direction,
				value: valueMapper[orderBy](lastItem),
			});
		}

		return {
			items: items.map((member) => ({
				userId: member.userId,
				name: member.name,
				lastName: member.lastName,
				email: member.email,
				pictureUrl: member.pictureUrl,
				role: member.role,
				joinedAt: member.joinedAt.toISOString(),
			})),
			cursor: nextCursor,
			hasNextPage,
		};

		function buildOrderBy(): SQL[] {
			return direction === "desc"
				? [desc(dbField), desc(workspaceMembers.userId)]
				: [asc(dbField), asc(workspaceMembers.userId)];
		}

		function buildSortConditions(): SQL | undefined {
			if (!cursor) return undefined;

			const value =
				orderBy === "joinedAt"
					? new Date(cursor.value as number)
					: (cursor.value as string);

			if (direction === "desc") {
				return or(
					lt(dbField, value),
					and(eq(dbField, value), lt(workspaceMembers.userId, cursor.id)),
				);
			}

			return or(
				gt(dbField, value),
				and(eq(dbField, value), gt(workspaceMembers.userId, cursor.id)),
			);
		}
	},
});
