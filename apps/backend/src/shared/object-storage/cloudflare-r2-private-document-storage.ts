import {
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	type S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ErrorDetails, ErrorDetailsException } from "../result";
import type {
	PrivateDocumentStorage,
	PrivateDocumentStorageConfig,
} from "./storage-service";

export const createR2PrivateDocumentStorage = (
	s3: S3Client,
	config: PrivateDocumentStorageConfig,
): PrivateDocumentStorage => ({
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

	upload: async (values) => {
		try {
			await s3.send(
				new PutObjectCommand({
					Bucket: config.bucketName,
					Key: values.key,
					Body: values.body,
					ContentType: values.contentType,
				}),
			);

			return values.key;
		} catch (error) {
			throw ErrorDetailsException.of(
				new ErrorDetails(
					"STORAGE_UPLOAD_FAILED",
					"Failed to upload document",
					500,
				),
				error,
			);
		}
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
