import { type DatabaseClient, db } from "@serviceflow/backend/shared/database";

const ROLLBACK = "TEST_ROLLBACK";

export const runTestInTransaction = async (
	cb: (tx: DatabaseClient) => void | Promise<void>,
) => {
	try {
		await db.transaction(async (tx) => {
			await cb(tx);
			throw new Error(ROLLBACK);
		});
	} catch (e) {
		if (e instanceof Error && e.message === ROLLBACK) return;
		throw e;
	}
};
