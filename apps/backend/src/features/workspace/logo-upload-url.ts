import type { StorageService } from "@serviceflow/backend/shared/object-storage/storage-service";
import { Result } from "@serviceflow/backend/shared/result";
import { workspaceErrors } from "./common/workspace.errors";
import type { WorkspaceRepository } from "./common/workspace-repository";

export const LogoUploadUrlHandler = async (
	query: {
		workspaceId: string;
		mimeType: "image/jpeg" | "image/png";
		fileExtension: string;
	},
	storageService: StorageService,
	workspaceRepository: WorkspaceRepository,
): Promise<Result<{ uploadUrl: string; storageKey: string }>> => {
	const { workspaceId, mimeType, fileExtension } = query;

	const workspace = await workspaceRepository.getById(workspaceId);
	if (!workspace) {
		return Result.failure(workspaceErrors.WORKSPACE_NOT_FOUND);
	}

	const storageKey = storageService.buildWorkspaceLogoKey(
		workspaceId,
		fileExtension,
	);

	const presignedUrlResult = await storageService.generatePresignedUrl({
		key: storageKey,
		contentType: mimeType,
	});

	if (presignedUrlResult.isFailure) {
		return Result.failure(presignedUrlResult.error);
	}

	const { uploadUrl } = presignedUrlResult.value;
	return Result.success({ uploadUrl, storageKey });
};
