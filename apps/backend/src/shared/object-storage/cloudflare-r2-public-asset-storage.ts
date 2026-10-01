import {
	GetObjectCommand,
	HeadObjectCommand,
	NotFound,
	PutObjectCommand,
	type S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
	PublicAssetStorage,
	PublicAssetStorageConfig,
} from "./storage-service";

export const createR2PublicAssetStorage = (
	s3: S3Client,
	config: PublicAssetStorageConfig,
): PublicAssetStorage => ({
	getFileBase64: async (key: string): Promise<string> => {
		const response = await s3.send(
			new GetObjectCommand({
				Bucket: config.bucketName,
				Key: key,
			}),
		);

		if (!response.Body) {
			throw new NotFound({
				message: "...",
				$metadata: {
					httpStatusCode: 404,
				},
			});
		}

		const buffer = await response.Body.transformToByteArray();
		const base64 = Buffer.from(buffer).toString("base64");

		return `data:${response.ContentType ?? "application/octet-stream"};base64,${base64}`;
	},

	fileExists: async (key: string): Promise<boolean> => {
		return await s3
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

	createUploadPresignedUrl: async (values: {
		key: string;
		contentType: "image/jpeg" | "image/png";
		expiresIn?: number;
	}): Promise<string> => {
		const command = new PutObjectCommand({
			Bucket: config.bucketName,
			Key: values.key,
			ContentType: values.contentType,
		});

		const uploadUrl = await getSignedUrl(s3, command, {
			expiresIn: values.expiresIn ?? 300,
		});

		return uploadUrl;
	},

	getPublicUrl: (key: string): string => `${config.publicDomain}/${key}`,
});
