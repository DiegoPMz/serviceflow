import {
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Result } from "../result";
import type { StorageService, StorageServiceConfig } from "./storage-service";
import { storageErrors } from "./storage-service.errors";

export const s3Client = new S3Client({
	region: "auto",
	endpoint: process.env.R2_ENDPOINT,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID!,
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
	},
});

const VALID_CONTENT_TYPES = new Set<string>(["image/jpeg", "image/png"]);

export const cloudflareR2StorageService = (
	s3: S3Client,
	config: StorageServiceConfig,
): StorageService => ({
	generatePresignedUrl: async (values: {
		key: string;
		contentType: "image/jpeg" | "image/png";
	}): Promise<Result<{ uploadUrl: string }>> => {
		if (!VALID_CONTENT_TYPES.has(values.contentType)) {
			return Result.failure(storageErrors.INVALID_FILE_TYPE);
		}

		const command = new PutObjectCommand({
			Bucket: config.bucketName,
			Key: values.key,
			ContentType: values.contentType,
		});

		const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

		return Result.success({
			uploadUrl,
		});
	},

	exists: async (key: string): Promise<boolean> => {
		return s3
			.send(
				new HeadObjectCommand({
					Bucket: config.bucketName,
					Key: key,
				}),
			)
			.then(() => true)
			.catch((err) => {
				if (
					err.name === "NotFound" ||
					err.name === "NoSuchKey" ||
					err.$metadata?.httpStatusCode === 404
				) {
					return false;
				}

				throw err;
			});
	},

	getPublicUrl: (key: string): string => {
		const cleanDomain = config.publicDomain.endsWith("/")
			? config.publicDomain.slice(0, -1)
			: config.publicDomain;
		const cleanKey = key.startsWith("/") ? key.slice(1) : key;

		return `${cleanDomain}/${cleanKey}`;
	},

	buildWorkspaceLogoKey: (
		workspaceId: string,
		fileExtension: string,
	): string => {
		const ext = fileExtension.replace(".", "");
		const timestamp = Date.now();

		return `workspaces/${workspaceId}/logos/logo-${timestamp}.${ext}`;
	},
});
