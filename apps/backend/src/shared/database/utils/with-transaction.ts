import { ErrorDetails, Result } from "../../result";
import type { DatabaseClient, DatabaseType } from "../client";

export const withTransaction = async <T>(
	db: DatabaseClient | DatabaseType,
	cb: (tx: DatabaseClient | DatabaseType) => Promise<Result<T>> | Result<T>,
): Promise<Result<T>> => {
	try {
		return await db.transaction(async (tx) => {
			const result = await cb(tx);

			if (result.isFailure) {
				throw result.error;
			}

			return result;
		});
	} catch (error: unknown) {
		if (error instanceof ErrorDetails) {
			return Result.failure<T>(error);
		}

		throw error;
	}
};
