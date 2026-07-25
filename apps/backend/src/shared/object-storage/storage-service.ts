import type { Result } from "../result";

export interface StorageServiceConfig {
	bucketName: string;
	publicDomain: string;
}

export type StorageService = {
	generatePresignedUrl: (values: {
		key: string;
		contentType: "image/jpeg" | "image/png";
	}) => Promise<
		Result<{
			uploadUrl: string;
		}>
	>;

	exists(key: string): Promise<boolean>;
	getPublicUrl(key: string): string;
	buildWorkspaceLogoKey(workspaceId: string, fileExtension: string): string;
};
