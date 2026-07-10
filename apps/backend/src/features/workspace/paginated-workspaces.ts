import {
	type DatabaseClient,
	workspaceMembers,
	workspaces,
} from "@serviceflow/backend/shared/database";
import {
	Cursor,
	type Pagination,
} from "@serviceflow/backend/shared/pagination";
import { Result } from "@serviceflow/backend/shared/result";
import { and, asc, desc, eq, gt, lt, or } from "drizzle-orm";
import { workspaceErrors } from "./common/workspace.errors";

interface WorkspacePaginationSort {
	field: "createdAt" | "updatedAt";
	order: "asc" | "desc";
}

interface PaginatedWorkspacesQuery {
	userId: string;
	cursor?: string | null;
	limit: number;
	sort?: WorkspacePaginationSort;
}

interface WorkspaceSummaryReadModel {
	id: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
}

const MAX_LIMIT = 50;
const DEFAULT_SORT: WorkspacePaginationSort = {
	field: "createdAt",
	order: "desc",
};

interface CursorInnerValue {
	field: WorkspacePaginationSort["field"];
	sortOrder: WorkspacePaginationSort["order"];
	id: string;
	value: string;
}

interface props {
	query: PaginatedWorkspacesQuery;
	dbClient: DatabaseClient;
}

export async function getPaginatedWorkspaces({
	query: { limit, userId, cursor, sort = DEFAULT_SORT },
	dbClient,
}: props): Promise<Result<Pagination<WorkspaceSummaryReadModel[]>>> {
	if (limit < 1 || limit > MAX_LIMIT)
		return Result.failure(workspaceErrors.WORKSPACE_LIMIT_EXCEEDED);

	let decodedCursor: CursorInnerValue | null = null;

	if (cursor) {
		decodedCursor = Cursor.decode<CursorInnerValue>(cursor);

		if (!decodedCursor)
			return Result.failure(workspaceErrors.WORKSPACE_INVALID_CURSOR);

		if (
			decodedCursor.field !== sort.field ||
			decodedCursor.sortOrder !== sort.order
		)
			return Result.failure(workspaceErrors.WORKSPACE_INVALID_CURSOR);
	}

	const sortColumn =
		sort.field === "createdAt" ? workspaces.createdAt : workspaces.updatedAt;

	const isSortDesc = sort.order === "desc";
	const queryConditions = [eq(workspaceMembers.userId, userId)];

	if (decodedCursor) {
		const cursorCondition = buildCursorCondition(decodedCursor);
		if (cursorCondition) queryConditions.push(cursorCondition);
	}

	const values: WorkspaceSummaryReadModel[] = await dbClient
		.select({
			id: workspaces.id,
			name: workspaces.name,
			createdAt: workspaces.createdAt,
			updatedAt: workspaces.updatedAt,
		})
		.from(workspaces)
		.innerJoin(
			workspaceMembers,
			eq(workspaceMembers.workspaceId, workspaces.id),
		)
		.where(and(...queryConditions))
		.orderBy(
			isSortDesc ? desc(sortColumn) : asc(sortColumn),
			isSortDesc ? desc(workspaces.id) : asc(workspaces.id),
		)
		.limit(limit + 1);

	const hasNextPage = values.length > limit;
	const items = hasNextPage ? values.slice(0, limit) : values;
	const lastItem = items[items.length - 1];

	const nextCursor =
		hasNextPage && lastItem
			? Cursor.encode<CursorInnerValue>({
					sortOrder: sort.order,
					field: sort.field,
					value:
						sort.field === "createdAt"
							? lastItem.createdAt.toISOString()
							: lastItem.updatedAt.toISOString(),
					id: lastItem.id,
				})
			: null;

	return Result.success({
		items,
		cursor: nextCursor,
		hasNextPage,
	});
}

function buildCursorCondition(cursorValue: CursorInnerValue) {
	const dateColumn =
		cursorValue.field === "createdAt"
			? workspaces.createdAt
			: workspaces.updatedAt;

	const isDesc = cursorValue.sortOrder === "desc";
	const dateValue = new Date(cursorValue.value);

	if (isDesc)
		return or(
			lt(dateColumn, dateValue),
			and(eq(dateColumn, dateValue), lt(workspaces.id, cursorValue.id)),
		);

	return or(
		gt(dateColumn, dateValue),
		and(eq(dateColumn, dateValue), gt(workspaces.id, cursorValue.id)),
	);
}
