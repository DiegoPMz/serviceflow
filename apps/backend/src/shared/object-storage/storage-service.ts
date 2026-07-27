import type { Result } from "../result";

export interface StorageServiceConfig {
	bucketName: string;
	publicDomain: string;
}

export type StorageService = {
	upload: (values: {
		key: string;
		body: Buffer | Uint8Array | ReadableStream;
		contentType: "application/pdf";
	}) => Promise<Result<string>>;

	getFileBase64: (key: string) => Promise<string>;
	fileExists: (key: string) => Promise<boolean>;

	createUploadPresignedUrl: (values: {
		key: string;
		contentType: "image/jpeg" | "image/png";
		expiresIn?: number;
	}) => Promise<string>;

	createSignedDownloadUrl: (values: {
		key: string;
		fileName: string;
		expiresIn?: number;
	}) => Promise<string>;
};
