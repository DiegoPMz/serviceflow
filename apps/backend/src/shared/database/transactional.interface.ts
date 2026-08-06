export interface Transactional<T> {
	transaction<R>(
		fn: (txRepo: Omit<T, "transaction">) => Promise<R>,
	): Promise<R>;
}
