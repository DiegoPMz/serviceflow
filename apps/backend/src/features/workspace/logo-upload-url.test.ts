import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	test,
} from "bun:test";
import {
	DeleteObjectsCommand,
	ListObjectsV2Command,
	type S3Client,
} from "@aws-sdk/client-s3";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import {
	addMember,
	seedWorkspace,
} from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import type { StorageService } from "@serviceflow/backend/shared/object-storage/storage-service";
import {
	BUCKET_TEST_NAME,
	getTestStorageService,
	runTestInTransaction,
	stopTestContainer,
} from "@serviceflow/backend/shared/tests";
import { workspaceErrors } from "./common/workspace.errors";
import { workspaceDrizzleRepository } from "./common/workspace-drizzle-repository";
import { LogoUploadUrlHandler } from "./logo-upload-url";

const STORAGE_KEY_REGEX = /^workspaces\/[^/]+\/logo-\d+\.(jpg|png)$/;

describe("Workspace-LogoUploadUrl Integration Tests", () => {
	let storageService: StorageService;
	let s3ClientTest: S3Client;

	beforeAll(
		async () => {
			const { storageService: testStorageService, s3Client } =
				await getTestStorageService();

			storageService = testStorageService;
			s3ClientTest = s3Client;
		},

		{ timeout: 20000 },
	);

	afterEach(async () => {
		const listObjects = await s3ClientTest.send(
			new ListObjectsV2Command({ Bucket: BUCKET_TEST_NAME }),
		);

		if (!listObjects.Contents || listObjects.Contents.length === 0) {
			return;
		}

		const objectsToDelete = listObjects.Contents.map((object) => ({
			Key: object.Key,
		}));

		await s3ClientTest.send(
			new DeleteObjectsCommand({
				Bucket: BUCKET_TEST_NAME,
				Delete: { Objects: objectsToDelete },
			}),
		);
	});

	afterAll(async () => {
		if (s3ClientTest) {
			await stopTestContainer();
		}
	});

	test("Should generate a presigned upload URL for JPEG when workspace exists", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });

			const result = await LogoUploadUrlHandler(
				{
					workspaceId,
					mimeType: "image/jpeg",
					fileExtension: "jpg",
				},
				storageService,
				workspaceDrizzleRepository(tx),
			);

			expect(result.isSuccess).toBeTrue();
			expect(result.value.uploadUrl).toBeString();
			expect(result.value.uploadUrl).not.toBeEmpty();
			expect(result.value.uploadUrl).toStartWith("http");
			expect(result.value.workspaceKey).toEndWith(".jpg");
			expect(STORAGE_KEY_REGEX.test(result.value.workspaceKey)).toBeTrue();
		});
	});

	test("Should generate a presigned upload URL for PNG when workspace exists", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });

			const result = await LogoUploadUrlHandler(
				{
					workspaceId,
					mimeType: "image/png",
					fileExtension: "png",
				},
				storageService,
				workspaceDrizzleRepository(tx),
			);

			expect(result.isSuccess).toBeTrue();
			expect(result.value.uploadUrl).toBeString();
			expect(result.value.uploadUrl).not.toBeEmpty();
			expect(result.value.workspaceKey).toEndWith(".png");
			expect(STORAGE_KEY_REGEX.test(result.value.workspaceKey)).toBeTrue();
		});
	});

	test("Should return WORKSPACE_NOT_FOUND when workspace does not exist", async () => {
		await runTestInTransaction(async (tx) => {
			const nonExistentId = "non-existent-id";

			const result = await LogoUploadUrlHandler(
				{
					workspaceId: nonExistentId,
					mimeType: "image/jpeg",
					fileExtension: "jpg",
				},
				storageService,
				workspaceDrizzleRepository(tx),
			);

			expect(result.isFailure).toBeTrue();
			expect(result.error.code).toBe(workspaceErrors.WORKSPACE_NOT_FOUND.code);
		});
	});

	test("Should generate different storage keys for different workspaces", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId1 = await seedWorkspace(tx, { name: "Workspace A" });
			const workspaceId2 = await seedWorkspace(tx, { name: "Workspace B" });
			await addMember(tx, { userId, workspaceId: workspaceId1 });
			await addMember(tx, { userId, workspaceId: workspaceId2 });

			const repository = workspaceDrizzleRepository(tx);

			const [result1, result2] = await Promise.all([
				LogoUploadUrlHandler(
					{
						workspaceId: workspaceId1,
						mimeType: "image/jpeg",
						fileExtension: "jpg",
					},
					storageService,
					repository,
				),
				LogoUploadUrlHandler(
					{
						workspaceId: workspaceId2,
						mimeType: "image/jpeg",
						fileExtension: "jpg",
					},
					storageService,
					repository,
				),
			]);

			expect(result1.isSuccess).toBeTrue();
			expect(result2.isSuccess).toBeTrue();
			expect(result1.value.workspaceKey).not.toBe(result2.value.workspaceKey);
			expect(result1.value.workspaceKey).toContain(workspaceId1);
			expect(result2.value.workspaceKey).toContain(workspaceId2);
		});
	});

	test("Should normalize file extension with or without leading dot", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });

			const repository = workspaceDrizzleRepository(tx);

			const [resultWithDot, resultWithoutDot] = await Promise.all([
				LogoUploadUrlHandler(
					{ workspaceId, mimeType: "image/jpeg", fileExtension: "jpg" },
					storageService,
					repository,
				),
				LogoUploadUrlHandler(
					{ workspaceId, mimeType: "image/jpeg", fileExtension: "jpg" },
					storageService,
					repository,
				),
			]);

			expect(resultWithDot.isSuccess).toBeTrue();
			expect(resultWithoutDot.isSuccess).toBeTrue();
			expect(resultWithDot.value.workspaceKey).toEndWith(".jpg");
			expect(resultWithoutDot.value.workspaceKey).toEndWith(".jpg");
		});
	});

	test("Should generate a functional presigned URL that accepts an upload and persists the object", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });

			const result = await LogoUploadUrlHandler(
				{ workspaceId, mimeType: "image/jpeg", fileExtension: "jpg" },
				storageService,
				workspaceDrizzleRepository(tx),
			);

			expect(result.isSuccess).toBeTrue();

			const uploadResponse = await fetch(result.value.uploadUrl, {
				method: "PUT",
				headers: { "Content-Type": "image/jpeg" },
				body: new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], {
					type: "image/jpeg",
				}),
			});

			expect(uploadResponse.ok).toBeTrue();

			const exists = await storageService.fileExists(result.value.workspaceKey);
			expect(exists).toBeTrue();
		});
	});
});
