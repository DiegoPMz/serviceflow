import type { PublicAssetStorage } from "@serviceflow/backend/shared/object-storage/storage-service";
import { Result, Updated } from "@serviceflow/backend/shared/result";
import { workspaceErrors } from "./common/workspace.errors";
import type { WorkspaceRepository } from "./common/workspace-repository";

export interface ConfirmLogoUploadCommand {
	workspaceId: string;
	fileKey: string;
}

interface ConfirmLogoUploadHandlerProps {
	command: ConfirmLogoUploadCommand;
	workspaceRepository: WorkspaceRepository;
	publicAssetStorage: PublicAssetStorage;
}

export const confirmLogoUploadHandler = async ({
	command,
	workspaceRepository,
	publicAssetStorage,
}: ConfirmLogoUploadHandlerProps): Promise<Result<Updated>> => {
	const logoExists = await publicAssetStorage.fileExists(command.fileKey);

	if (!logoExists) {
		return Result.failure(workspaceErrors.LOGO_FILE_NOT_FOUND);
	}

	const workspace = await workspaceRepository.getById(command.workspaceId);

	if (!workspace) {
		return Result.failure(workspaceErrors.WORKSPACE_NOT_FOUND);
	}

	const updateResult = workspace.updateLogoKey(command.fileKey);

	if (updateResult.isFailure) {
		return Result.failure(updateResult.error);
	}

	await workspaceRepository.update(workspace);

	return Updated.toResult();
};
