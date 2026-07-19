export interface Pagination<E> {
	items: E[];
	cursor: string | null;
	hasNextPage: boolean;
}

export type SortDirection = "asc" | "desc";

export interface PaginationRequest<TOrderBy extends string = string> {
	limit: number;
	orderBy: TOrderBy | "id";
	direction: SortDirection;
	search?: string;
	cursor?: string;
}

export interface PaginationCursor<
	TOrderBy extends string = string,
	TValue = unknown,
> {
	orderBy: TOrderBy | "id";
	direction: SortDirection;
	value?: TValue;
	id: string;
}
