import {
	type DatabaseClient,
	type DatabaseType,
	workspaceMembers,
	workspaces,
} from "@serviceflow/backend/shared/database";
import { Result } from "@serviceflow/backend/shared/result";
import { and, eq } from "drizzle-orm";
import { workspaceMemberErrors } from "./common/workspace-member.errors";
import type { WorkspaceRole } from "./common/workspace-member.model";

interface GetWorkspaceSummaryQuery {
	userId: string;
	workspaceId: string;
}

export interface WorkspaceSummaryReadModel {
	readonly id: string;
	readonly name: string;
	readonly updatedAt: Date;
	readonly company: {
		readonly name: string;
		readonly phone: string;
		readonly email: string;
		readonly address: string;
		readonly logoKey: string | null;
	};
	readonly userRole: WorkspaceRole;
}

export interface GetWorkspaceSummaryHandlerProps {
	query: GetWorkspaceSummaryQuery;
	db: DatabaseClient | DatabaseType;
}

export const getWorkspaceSummaryHandler = async ({
	query,
	db,
}: GetWorkspaceSummaryHandlerProps): Promise<
	Result<WorkspaceSummaryReadModel>
> => {
	const { userId, workspaceId } = query;

	const row = await db
		.select({
			id: workspaces.id,
			name: workspaces.name,
			updatedAt: workspaces.updatedAt,
			companyName: workspaces.companyName,
			companyPhone: workspaces.companyPhone,
			companyEmail: workspaces.companyEmail,
			companyAddress: workspaces.companyAddress,
			companyLogoKey: workspaces.companyLogoKey,
			userRole: workspaceMembers.role,
		})
		.from(workspaces)
		.innerJoin(
			workspaceMembers,
			and(
				eq(workspaceMembers.workspaceId, workspaces.id),
				eq(workspaceMembers.userId, userId),
			),
		)
		.where(eq(workspaces.id, workspaceId))
		.get();

	if (!row) {
		return Result.failure(workspaceMemberErrors.NOT_A_MEMBER);
	}

	return Result.success({
		id: row.id,
		name: row.name,
		updatedAt: row.updatedAt,
		company: {
			name: row.companyName,
			phone: row.companyPhone,
			email: row.companyEmail,
			address: row.companyAddress,
			logoKey: row.companyLogoKey,
		},
		userRole: row.userRole,
	});
};
