import { CreateBucketCommand, S3Client } from "@aws-sdk/client-s3";
import {
	MinioContainer,
	type StartedMinioContainer,
} from "@testcontainers/minio";
import { cloudflareR2StorageService } from "../object-storage/cloudflare-r2-storage-service";
import type { StorageService } from "../object-storage/storage-service";

let instance: StartedMinioContainer | null = null;
let s3Client: S3Client | null = null;
let storageService: StorageService | null = null;

export const BUCKET_TEST_NAME = "test-bucket";

export const getTestStorageService = async (): Promise<{
	storageService: StorageService;
	s3Client: S3Client;
}> => {
	if (storageService && s3Client) {
		return {
			storageService,
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

	storageService = cloudflareR2StorageService(s3Client, {
		bucketName: BUCKET_TEST_NAME,
		publicDomain: `${endpoint}/${BUCKET_TEST_NAME}`,
	});

	return {
		storageService,
		s3Client,
	};
};

export const stopTestContainer = async () => {
	if (instance) {
		await instance.stop();
		instance = null;
		s3Client = null;
		storageService = null;
	}
};
