import type {
	DatabaseClient,
	DatabaseType,
} from "@serviceflow/backend/shared/database";
import { activityDrizzleRepository } from "../../activity/common/activity-drizzle-repository";
import { workspaceDrizzleRepository } from "../../workspace/common/workspace-drizzle-repository";
import { OrderDrizzleRepository } from "./order-drizzle-repository";
import type {
	OrdersRepositories,
	OrdersUnitOfWork,
} from "./orders.unit-of-work";

export const createDrizzleOrdersUnitOfWork = (
	db: DatabaseClient | DatabaseType,
): OrdersUnitOfWork => ({
	async transaction<R>(
		fn: (txRepos: OrdersRepositories) => Promise<R>,
	): Promise<R> {
		return await db.transaction(async (tx) => {
			const txRepos: OrdersRepositories = {
				orders: OrderDrizzleRepository(tx),
				workspaces: workspaceDrizzleRepository(tx),
				activities: activityDrizzleRepository(tx),
			};

			return await fn(txRepos);
		});
	},
});
