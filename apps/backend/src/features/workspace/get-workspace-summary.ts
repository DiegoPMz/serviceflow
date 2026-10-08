import {
	type DatabaseClient,
	type DatabaseType,
	orders,
	workspaceMembers,
	workspaces,
} from "@serviceflow/backend/shared/database";
import type { PublicAssetStorage } from "@serviceflow/backend/shared/object-storage/storage-service";
import { Result } from "@serviceflow/backend/shared/result";
import { and, count, eq } from "drizzle-orm";
import { workspaceErrors } from "./common/workspace.errors";
import type { WorkspaceRole } from "./common/workspace-member.model";

interface GetWorkspaceSummaryQuery {
	userId: string;
	workspaceId: string;
}

export interface WorkspaceSummaryDto {
	readonly id: string;
	readonly name: string;
	readonly logoUrl: string | null;
	readonly userRole: WorkspaceRole;
	readonly orderCount: number;
}

export interface GetWorkspaceSummaryHandlerProps {
	query: GetWorkspaceSummaryQuery;
	db: DatabaseClient | DatabaseType;
	publicAssetStorage: PublicAssetStorage;
}

export const getWorkspaceSummaryHandler = async ({
	query,
	db,
	publicAssetStorage,
}: GetWorkspaceSummaryHandlerProps): Promise<Result<WorkspaceSummaryDto>> => {
	const { userId, workspaceId } = query;

	const workspace = await db
		.select({
			id: workspaces.id,
			name: workspaces.name,
			logoKey: workspaces.companyLogoKey,
			userRole: workspaceMembers.role,
			orderCount: count(orders.id),
		})
		.from(workspaces)
		.innerJoin(
			workspaceMembers,
			and(
				eq(workspaceMembers.workspaceId, workspaces.id),
				eq(workspaceMembers.userId, userId),
			),
		)
		.leftJoin(orders, eq(orders.workspaceId, workspaces.id))
		.where(eq(workspaces.id, workspaceId))
		.groupBy(
			workspaces.id,
			workspaces.name,
			workspaces.companyLogoKey,
			workspaceMembers.role,
		)
		.get();

	if (!workspace) {
		return Result.failure(workspaceErrors.WORKSPACE_NOT_FOUND);
	}

	const workspaceDto: WorkspaceSummaryDto = {
		id: workspace.id,
		name: workspace.name,
		userRole: workspace.userRole,
		logoUrl: workspace.logoKey
			? publicAssetStorage.getPublicUrl(workspace.logoKey)
			: null,
		orderCount: workspace.orderCount,
	};

	return Result.success(workspaceDto);
};
