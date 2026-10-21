import type {
	DatabaseClient,
	DatabaseType,
} from "@serviceflow/backend/shared/database";
import { activityDrizzleRepository } from "../../activity/common/activity-drizzle-repository";
import { clientDrizzleRepository } from "./client-drizzle-repository";
import type {
	ClientsRepositories,
	ClientsUnitOfWork,
} from "./clients.unit-of-work";

export const createDrizzleClientsUnitOfWork = (
	db: DatabaseClient | DatabaseType,
): ClientsUnitOfWork => ({
	async transaction<R>(
		fn: (txRepos: ClientsRepositories) => Promise<R>,
	): Promise<R> {
		return await db.transaction(async (tx) => {
			const txRepos: ClientsRepositories = {
				clients: clientDrizzleRepository(tx),
				activities: activityDrizzleRepository(tx),
			};

			return await fn(txRepos);
		});
	},
});
