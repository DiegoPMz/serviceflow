import type { Eden } from "@/shared/http/client";
import type { CreateWorkspaceInput } from "./create-workspace.schema";
import { getFileExtension, uploadWorkspaceLogo } from "./upload-workspace-logo";

export interface CreateWorkspaceUseCaseInput {
	workspaceData: CreateWorkspaceInput;
	eden: Eden;
}

export type WorkspaceLogoResult =
	| {
			status: "uploaded";
	  }
	| {
			status: "failed";
			stage: "upload-url" | "upload";
			httpStatus?: number;
	  };

export interface CreateWorkspaceUseCaseResult {
	workspaceId: string;
	logo: WorkspaceLogoResult;
}

export async function createWorkspace({
	workspaceData,
	eden,
}: CreateWorkspaceUseCaseInput): Promise<CreateWorkspaceUseCaseResult> {
	const { data: workspace, error: workspaceError } =
		await eden.v1.workspaces.post({
			...workspaceData,
		});

	if (workspaceError) {
		throw workspaceError;
	}

	const { data: uploadConfig, error: uploadUrlError } = await eden.v1
		.workspaces({ workspaceId: workspace.workspaceId })
		.logo["upload-url"].post({
			fileExtension: getFileExtension(workspaceData.logoFile),
			mimeType: workspaceData.logoFile.type as "image/jpeg" | "image/png",
		});

	if (uploadUrlError) {
		console.error("Failed to get workspace logo upload URL", {
			workspaceId: workspace.workspaceId,
			error: uploadUrlError,
		});

		return {
			workspaceId: workspace.workspaceId,
			logo: {
				status: "failed",
				stage: "upload-url",
			},
		};
	}

	const uploadResult = await uploadWorkspaceLogo({
		logo: workspaceData.logoFile,
		url: uploadConfig.uploadUrl,
	});

	if (!uploadResult.ok) {
		console.error("Failed to upload workspace logo", {
			workspaceId: workspace.workspaceId,
			status: uploadResult.status,
		});

		return {
			workspaceId: workspace.workspaceId,
			logo: {
				status: "failed",
				stage: "upload",
				httpStatus: uploadResult.status,
			},
		};
	}

	const confirmSaveLogo = await eden.v1
		.workspaces({ workspaceId: workspace.workspaceId })
		.logo.confirm.post({ fileKey: uploadConfig.workspaceKey });

	if (confirmSaveLogo.error) {
		console.error("Failed to confirm the workspace logo", {
			workspaceId: workspace.workspaceId,
			error_code: confirmSaveLogo.error.value.code,
		});

		return {
			workspaceId: workspace.workspaceId,
			logo: {
				status: "failed",
				stage: "upload",
				httpStatus: confirmSaveLogo.status,
			},
		};
	}

	return {
		workspaceId: workspace.workspaceId,
		logo: {
			status: "uploaded",
		},
	};
}
