export interface Pagination<E> {
	items: E;
	cursor: string | null;
	hasNextPage: boolean;
}
