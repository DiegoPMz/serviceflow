import {
	GetObjectCommand,
	HeadObjectCommand,
	NotFound,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Config } from "../config";
import { Result } from "../result";
import type { StorageService, StorageServiceConfig } from "./storage-service";

export const s3Client = new S3Client({
	region: "auto",
	endpoint: r2Config.endpoint,
	credentials: {
		accessKeyId: r2Config.accessKeyId,
		secretAccessKey: r2Config.secretAccessKey,
	},
});

export const cloudflareR2StorageService = (
	s3: S3Client,
	config: StorageServiceConfig,
): StorageService => ({
	upload: async (values: {
		key: string;
		body: Buffer | Uint8Array | ReadableStream;
		contentType: string;
	}): Promise<Result<string>> => {
		await s3.send(
			new PutObjectCommand({
				Bucket: config.bucketName,
				Key: values.key,
				Body: values.body,
				ContentType: values.contentType,
			}),
		);

		const cleanDomain = config.publicDomain.endsWith("/")
			? config.publicDomain.slice(0, -1)
			: config.publicDomain;
		const cleanKey = values.key.startsWith("/")
			? values.key.slice(1)
			: values.key;

		const url = `${cleanDomain}/${cleanKey}`;
		return Result.success(url);
	},

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

	fileExists: (key: string): Promise<boolean> =>
		s3
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
			}),

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

	createSignedDownloadUrl: (values: {
		key: string;
		fileName: string;
		expiresIn?: number;
	}): Promise<string> => {
		const command = new GetObjectCommand({
			Bucket: config.bucketName,
			Key: values.key,
			ResponseContentDisposition: `attachment; filename="${values.fileName}"`,
		});

		return getSignedUrl(s3, command, { expiresIn: values.expiresIn ?? 300 });
	},
});
