import { storageKeys } from "@serviceflow/backend/shared/object-storage/storage-keys";
import type { PublicAssetStorage } from "@serviceflow/backend/shared/object-storage/storage-service";
import { Result } from "@serviceflow/backend/shared/result";
import { workspaceErrors } from "./common/workspace.errors";
import type { WorkspaceRepository } from "./common/workspace-repository";

export interface LogoUploadUrlDto {
	uploadUrl: string;
	workspaceKey: string;
}

export const LogoUploadUrlHandler = async (
	query: {
		workspaceId: string;
		mimeType: "image/jpeg" | "image/png";
		fileExtension: "png" | "jpeg" | "jpg";
	},

	publicAssetStorage: PublicAssetStorage,
	workspaceRepository: WorkspaceRepository,
): Promise<Result<LogoUploadUrlDto>> => {
	const { workspaceId, mimeType, fileExtension } = query;

	const workspace = await workspaceRepository.getById(workspaceId);
	if (!workspace) {
		return Result.failure(workspaceErrors.WORKSPACE_NOT_FOUND);
	}

	const workspaceLogoKey = storageKeys.workspaceLogo(
		workspaceId,
		fileExtension,
	);

	const presignedUrl = await publicAssetStorage.createUploadPresignedUrl({
		key: workspaceLogoKey,
		contentType: mimeType,
	});

	return Result.success({
		uploadUrl: presignedUrl,
		workspaceKey: workspaceLogoKey,
	});
};
