import type {
	DatabaseClient,
	DatabaseType,
} from "@serviceflow/backend/shared/database";
import { activityDrizzleRepository } from "../../activity/common/activity-drizzle-repository";
import { deviceDrizzleRepository } from "./device-drizzle-repository";
import type {
	DevicesRepositories,
	DevicesUnitOfWork,
} from "./devices.unit-of-work";

export const createDrizzleDevicesUnitOfWork = (
	db: DatabaseClient | DatabaseType,
): DevicesUnitOfWork => ({
	async transaction<R>(
		fn: (txRepos: DevicesRepositories) => Promise<R>,
	): Promise<R> {
		return await db.transaction(async (tx) => {
			const txRepos: DevicesRepositories = {
				devices: deviceDrizzleRepository(tx),
				activities: activityDrizzleRepository(tx),
			};

			return await fn(txRepos);
		});
	},
});
