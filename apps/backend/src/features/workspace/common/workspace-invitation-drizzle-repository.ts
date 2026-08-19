import {
	type DatabaseClient,
	type DatabaseType,
	workspaceInvitations,
} from "@serviceflow/backend/shared/database";
import {
	Cursor,
	type Pagination,
	type SortDirection,
} from "@serviceflow/backend/shared/pagination";
import {
	and,
	asc,
	desc,
	eq,
	gt,
	gte,
	inArray,
	lt,
	or,
	type SQL,
} from "drizzle-orm";
import type {
	WorkspaceInvitationCursor,
	WorkspaceInvitationOrderBy,
} from "../paginated-workspace-invitations";
import {
	type InvitationRole,
	WorkspaceInvitation,
} from "./workspace-invitation.model";
import type { WorkspaceInvitationReadModel } from "./workspace-invitation.read-model";
import type { WorkspaceInvitationRepository } from "./workspace-invitation-repository";

export const workspaceInvitationDrizzleRepository = (
	db: DatabaseClient | DatabaseType,
): WorkspaceInvitationRepository => ({
	save: async (invitation: WorkspaceInvitation): Promise<void> => {
		await db.insert(workspaceInvitations).values({
			token: invitation.token,
			workspaceId: invitation.workspaceId,
			role: invitation.role,
			email: invitation.email,
			emailId: invitation.emailId,
			status: invitation.status,
			acceptedAt: invitation.acceptedAt,
			cancelledAt: invitation.cancelledAt,
			rejectedAt: invitation.rejectedAt,
			expirationDays: invitation.expirationDays,
			expiresAt: invitation.expiresAt,
			createdAt: invitation.createdAt,
		});
	},

	update: async (invitation: WorkspaceInvitation): Promise<void> => {
		await db
			.update(workspaceInvitations)
			.set({
				token: invitation.token,
				emailId: invitation.emailId,
				status: invitation.status,
				acceptedAt: invitation.acceptedAt,
				cancelledAt: invitation.cancelledAt,
				rejectedAt: invitation.rejectedAt,
				expiresAt: invitation.expiresAt,
			})
			.where(
				and(
					eq(workspaceInvitations.workspaceId, invitation.workspaceId),
					eq(workspaceInvitations.email, invitation.email),
				),
			);
	},

	findByToken: async (token: string): Promise<WorkspaceInvitation | null> => {
		const entity = await db.query.workspaceInvitations.findFirst({
			where: (invitations, { eq }) => eq(invitations.token, token),
		});

		if (!entity) return null;
		return toModel(entity);
	},

	deleteByToken: async (token: string): Promise<void> => {
		await db
			.delete(workspaceInvitations)
			.where(eq(workspaceInvitations.token, token));
	},

	findByEmailAndWorkspace: async (
		email: string,
		workspaceId: string,
	): Promise<WorkspaceInvitation | null> => {
		const entity = await db.query.workspaceInvitations.findFirst({
			where: (invitations, { and, eq }) =>
				and(
					eq(invitations.email, email.toLowerCase().trim()),
					eq(invitations.workspaceId, workspaceId),
				),
		});

		if (!entity) return null;
		return toModel(entity);
	},

	getAllPaginated: async ({
		workspaceId,
		createdAfter,
		limit,
		cursor,
		orderBy,
		direction,
	}: {
		workspaceId: string;
		createdAfter: Date;
		limit: number;
		cursor?: WorkspaceInvitationCursor;
		orderBy: WorkspaceInvitationOrderBy;
		direction: SortDirection;
	}): Promise<Pagination<WorkspaceInvitationReadModel>> => {
		const statuses: WorkspaceInvitationReadModel["status"][] = [
			"accepted",
			"pending",
			"rejected",
		];

		const baseConditions = [
			eq(workspaceInvitations.workspaceId, workspaceId),
			inArray(workspaceInvitations.status, statuses),
			gte(workspaceInvitations.createdAt, createdAfter),
		];

		const sortCondition = buildSortConditions();
		const conditions = sortCondition
			? and(...baseConditions, sortCondition)
			: and(...baseConditions);

		const entities = await db
			.select({
				token: workspaceInvitations.token,
				email: workspaceInvitations.email,
				status: workspaceInvitations.status,
				createdAt: workspaceInvitations.createdAt,
			})
			.from(workspaceInvitations)
			.where(conditions)
			.orderBy(...buildOrderBy())
			.limit(limit + 1);

		const hasNextPage = entities.length > limit;
		const items = entities.slice(0, limit);
		const lastItem = items.at(-1);

		let nextCursor: string | null = null;

		if (hasNextPage && lastItem) {
			nextCursor = Cursor.encode<WorkspaceInvitationCursor>({
				id: lastItem.token,
				orderBy,
				direction,
				value: lastItem.createdAt.toISOString(),
			});
		}

		return {
			items: items.map((entity) => ({
				token: entity.token,
				email: entity.email,
				status: entity.status as WorkspaceInvitationReadModel["status"],
				issuedAt: entity.createdAt.toISOString(),
			})),
			cursor: nextCursor,
			hasNextPage,
		};

		function buildOrderBy(): SQL[] {
			return direction === "desc"
				? [
						desc(workspaceInvitations.createdAt),
						desc(workspaceInvitations.token),
					]
				: [
						asc(workspaceInvitations.createdAt),
						asc(workspaceInvitations.token),
					];
		}

		function buildSortConditions(): SQL | undefined {
			if (!cursor) return undefined;

			const value = new Date(cursor.value ?? 0);

			if (direction === "desc") {
				return or(
					lt(workspaceInvitations.createdAt, value),
					and(
						eq(workspaceInvitations.createdAt, value),
						lt(workspaceInvitations.token, cursor.id),
					),
				);
			}

			return or(
				gt(workspaceInvitations.createdAt, value),
				and(
					eq(workspaceInvitations.createdAt, value),
					gt(workspaceInvitations.token, cursor.id),
				),
			);
		}
	},

	transaction: async <R>(
		fn: (txRepo: WorkspaceInvitationRepository) => Promise<R>,
	): Promise<R> => {
		return await db.transaction(async (tx) => {
			const txRepo = workspaceInvitationDrizzleRepository(tx);
			return await fn(txRepo);
		});
	},
});

const toModel = (
	entity: typeof workspaceInvitations.$inferSelect,
): WorkspaceInvitation =>
	WorkspaceInvitation.reconstitute({
		token: entity.token,
		workspaceId: entity.workspaceId,
		role: entity.role as InvitationRole,
		email: entity.email,
		emailId: entity.emailId,
		status: entity.status,
		acceptedAt: entity.acceptedAt,
		cancelledAt: entity.cancelledAt,
		rejectedAt: entity.rejectedAt,
		expiresAt: entity.expiresAt,
		createdAt: entity.createdAt,
		expirationDays: entity.expirationDays,
	});
