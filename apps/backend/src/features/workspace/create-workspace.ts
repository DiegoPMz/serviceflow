import { Created, Result } from "@serviceflow/backend/shared/result";
import { Workspace } from "./common/workspace.model";
import type { WorkspaceRepository } from "./common/workspace-repository";

interface CreateWorkspaceCommand {
	userId: string;
	workspaceName: string;
}

interface createWorkspaceProps {
	command: CreateWorkspaceCommand;
	repository: WorkspaceRepository;
}

export async function createWorkspace({
	command,
	repository,
}: createWorkspaceProps): Promise<Result<Created>> {
	const { isFailure, error, value } = Workspace.create({
		name: command.workspaceName,
		ownerId: command.userId,
	});

	if (isFailure) return Result.failure(error);

	await repository.save(value);
	return Created.toResult();
}
