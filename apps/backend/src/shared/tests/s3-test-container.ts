import { CreateBucketCommand, S3Client } from "@aws-sdk/client-s3";
import {
  MinioContainer,
  type StartedMinioContainer,
} from "@testcontainers/minio";
import { createR2PrivateDocumentStorage } from "../object-storage/cloudflare-r2-private-document-storage";
import { createR2PublicAssetStorage } from "../object-storage/cloudflare-r2-public-asset-storage";
import type {
  PrivateDocumentStorage,
  PublicAssetStorage,
} from "../object-storage/storage-service";

let instance: StartedMinioContainer | null = null;
let s3Client: S3Client | null = null;
let privateDocumentStorage: PrivateDocumentStorage | null = null;
let publicAssetStorage: PublicAssetStorage | null = null;

export const BUCKET_TEST_NAME = "test-bucket";

export const getTestStorageService = async (): Promise<{
	privateDocumentStorage: PrivateDocumentStorage;
	publicAssetStorage: PublicAssetStorage;
	s3Client: S3Client;
}> => {
	if (privateDocumentStorage && publicAssetStorage && s3Client) {
		return {
			privateDocumentStorage,
			publicAssetStorage,
			s3Client,
		};
	}

	instance = await new MinioContainer("sourcemation/minio:latest").start();
	const endpoint = instance.getConnectionUrl();

	s3Client = new S3Client({
		endpoint,
		region: "us-east-1",
		credentials: {
			accessKeyId: instance.getUsername(),
			secretAccessKey: instance.getPassword(),
		},
		forcePathStyle: true,
	});

	await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_TEST_NAME }));

	privateDocumentStorage = createR2PrivateDocumentStorage(s3Client, {
		bucketName: BUCKET_TEST_NAME,
	});

	publicAssetStorage = createR2PublicAssetStorage(s3Client, {
		bucketName: BUCKET_TEST_NAME,
		publicDomain: `${endpoint}/${BUCKET_TEST_NAME}`,
	});

	return {
		privateDocumentStorage,
		publicAssetStorage,
		s3Client,
	};
};

export const stopTestContainer = async () => {
	if (instance) {
		await instance.stop();
		instance = null;
		s3Client = null;
		privateDocumentStorage = null;
		publicAssetStorage = null;
	}
};
