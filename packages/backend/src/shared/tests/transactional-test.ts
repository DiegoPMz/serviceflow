import { db } from "../database/client";

export type DatabaseClient = Parameters<
	Parameters<typeof db.transaction>[0]
>[0];

const ROLLBACK_SIGNAL = "ROLLBACK_TEST_TRANSACTION";

export async function runInTransaction(
	callback: (tx: DatabaseClient) => Promise<void>,
): Promise<void> {
	try {
		await db.transaction(async (tx) => {
			await callback(tx);
			throw new Error(ROLLBACK_SIGNAL);
		});
	} catch (error) {
		if (error instanceof Error && error.message === ROLLBACK_SIGNAL) {
			return;
		}
		throw error;
	}
}
