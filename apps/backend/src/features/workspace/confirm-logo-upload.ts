import type { StorageService } from "@serviceflow/backend/shared/object-storage/storage-service";
import { Result, Updated } from "@serviceflow/backend/shared/result";
import { workspaceErrors } from "./common/workspace.errors";
import type { WorkspaceRepository } from "./common/workspace-repository";

interface ConfirmLogoUploadCommand {
	workspaceId: string;
	fileKey: string;
}

interface ConfirmLogoUploadHandlerProps {
	command: ConfirmLogoUploadCommand;
	workspaceRepository: WorkspaceRepository;
	storageService: StorageService;
}

export const confirmLogoUploadHandler = async ({
	command,
	workspaceRepository,
	storageService,
}: ConfirmLogoUploadHandlerProps): Promise<Result<Updated>> => {
	const logoExists = await storageService.exists(command.fileKey);

	if (!logoExists) {
		return Result.failure(workspaceErrors.LOGO_FILE_NOT_FOUND);
	}

	const workspace = await workspaceRepository.getById(command.workspaceId);

	if (!workspace) {
		return Result.failure(workspaceErrors.WORKSPACE_NOT_FOUND);
	}

	const publicUrl = storageService.getPublicUrl(command.fileKey);

	const updateResult = workspace.updateLogoUrl(publicUrl);

	if (updateResult.isFailure) {
		return Result.failure(updateResult.error);
	}

	await workspaceRepository.update(workspace);
	return Updated.toResult();
};
