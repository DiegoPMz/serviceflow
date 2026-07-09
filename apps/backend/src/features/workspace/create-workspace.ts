import {
	type DatabaseType,
	workspaceMembers,
	workspaces,
} from "@serviceflow/backend/shared/database";
import { Created, Result } from "@serviceflow/backend/shared/result";
import { Workspace } from "./common/workspace.model";

type DatabaseClient = Parameters<Parameters<DatabaseType["transaction"]>[0]>[0];

interface CreateWorkspaceCommand {
	userId: string;
	workspaceName: string;
}

interface createWorkspaceProps {
	command: CreateWorkspaceCommand;

	dbClient: DatabaseClient;
}

export async function createWorkspace({
	command,
	dbClient,
}: createWorkspaceProps): Promise<Result<Created>> {
	const { isFailure, error, value } = Workspace.create({
		name: command.workspaceName,
	});

	if (isFailure) return Result.failure(error);

	await dbClient.transaction(async (tx) => {
		await tx.insert(workspaces).values({
			id: value.id,
			name: value.name,
			createdAt: value.createdAt,
			updatedAt: value.updatedAt,
		});

		await tx.insert(workspaceMembers).values({
			userId: command.userId,
			role: "owner",
			workspaceId: value.id,
		});
	});

	return Created.toResult();
}
