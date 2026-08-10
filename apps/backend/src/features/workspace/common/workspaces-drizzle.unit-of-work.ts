import type {
	DatabaseClient,
	DatabaseType,
} from "@serviceflow/backend/shared/database";
import { workspaceMemberDrizzleRepository } from "./workspace-drizzle-member-repository";
import { workspaceInvitationDrizzleRepository } from "./workspace-invitation-drizzle-repository";
import type {
	WorkspacesRepositories,
	WorkspacesUnitOfWork,
} from "./workspaces.unit-of-work";

export const createDrizzleWorkspacesUnitOfWork = (
	db: DatabaseType | DatabaseClient,
): WorkspacesUnitOfWork => ({
	async transaction<R>(
		fn: (txRepos: WorkspacesRepositories) => Promise<R>,
	): Promise<R> {
		return await db.transaction(async (tx) => {
			const txRepos: WorkspacesRepositories = {
				invitations: workspaceInvitationDrizzleRepository(tx),
				members: workspaceMemberDrizzleRepository(tx),
			};
			return await fn(txRepos);
		});
	},
});
