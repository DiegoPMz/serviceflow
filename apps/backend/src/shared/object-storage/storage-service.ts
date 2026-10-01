export interface PrivateDocumentStorageConfig {
	bucketName: string;
}

export interface PrivateDocumentStorage {
	fileExists(key: string): Promise<boolean>;

	upload(values: {
		key: string;
		body: Buffer | Uint8Array | ReadableStream;
		contentType: "application/pdf";
	}): Promise<string>;

	createSignedDownloadUrl(values: {
		key: string;
		fileName: string;
		expiresIn?: number;
	}): Promise<string>;
}

export interface PublicAssetStorageConfig {
	bucketName: string;
	publicDomain: string;
}

export interface PublicAssetStorage {
	getFileBase64(key: string): Promise<string>;

	getPublicUrl: (key: string) => string;

	fileExists(key: string): Promise<boolean>;

	createUploadPresignedUrl(values: {
		key: string;
		contentType: "image/jpeg" | "image/png";
		expiresIn?: number;
	}): Promise<string>;
}
