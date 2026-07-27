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
	PutObjectCommand,
	type S3Client,
} from "@aws-sdk/client-s3";
import { workspaces } from "@serviceflow/backend/shared/database/schema";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import {
	addMember,
	seedWorkspace,
} from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import { storageKeys } from "@serviceflow/backend/shared/object-storage/storage-keys";
import type { StorageService } from "@serviceflow/backend/shared/object-storage/storage-service";
import {
	BUCKET_TEST_NAME,
	getTestStorageService,
	runTestInTransaction,
	stopTestContainer,
} from "@serviceflow/backend/shared/tests";
import { eq } from "drizzle-orm";
import { workspaceErrors } from "./common/workspace.errors";
import { workspaceDrizzleRepository } from "./common/workspace-drizzle-repository";
import { confirmLogoUploadHandler } from "./confirm-logo-upload";

const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);

async function uploadTestFile(
	s3Client: S3Client,
	fileKey: string,
): Promise<void> {
	await s3Client.send(
		new PutObjectCommand({
			Bucket: BUCKET_TEST_NAME,
			Key: fileKey,
			Body: JPEG_BYTES,
			ContentType: "image/jpeg",
		}),
	);
}

describe("Workspace-ConfirmLogoUpload Integration Tests", () => {
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

	test("Should confirm logo upload successfully when file exists and workspace exists", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });

			const fileKey = storageKeys.workspaceLogo(workspaceId, "jpg");
			await uploadTestFile(s3ClientTest, fileKey);

			const result = await confirmLogoUploadHandler({
				command: { workspaceId, fileKey },
				workspaceRepository: workspaceDrizzleRepository(tx),
				storageService,
			});

			expect(result.isSuccess).toBeTrue();
		});
	});

	test("Should return LOGO_FILE_NOT_FOUND when file does not exist in storage", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });

			const fileKey = storageKeys.workspaceLogo(workspaceId, "jpg");

			const result = await confirmLogoUploadHandler({
				command: { workspaceId, fileKey },
				workspaceRepository: workspaceDrizzleRepository(tx),
				storageService,
			});

			expect(result.isFailure).toBeTrue();
			expect(result.error.code).toBe(workspaceErrors.LOGO_FILE_NOT_FOUND.code);
		});
	});

	test("Should return WORKSPACE_NOT_FOUND when workspace does not exist", async () => {
		await runTestInTransaction(async (tx) => {
			const fileKey = "workspaces/non-existent/logos/logo-test.jpg";
			await uploadTestFile(s3ClientTest, fileKey);

			const result = await confirmLogoUploadHandler({
				command: { workspaceId: "non-existent-id", fileKey },
				workspaceRepository: workspaceDrizzleRepository(tx),
				storageService,
			});

			expect(result.isFailure).toBeTrue();
			expect(result.error.code).toBe(workspaceErrors.WORKSPACE_NOT_FOUND.code);
		});
	});

	test("Should persist the public logo URL in the database after confirmation", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });

			const fileKey = storageKeys.workspaceLogo(workspaceId, "jpg");
			await uploadTestFile(s3ClientTest, fileKey);

			await confirmLogoUploadHandler({
				command: { workspaceId, fileKey },
				workspaceRepository: workspaceDrizzleRepository(tx),
				storageService,
			});

			const [workspace] = await tx
				.select({ companyLogoKey: workspaces.companyLogoKey })
				.from(workspaces)
				.where(eq(workspaces.id, workspaceId));

			expect(workspace?.companyLogoKey).toBe(fileKey);
		});
	});

	test("Should update the updatedAt timestamp after confirmation", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });

			const fileKey = storageKeys.workspaceLogo(workspaceId, "jpg");
			await uploadTestFile(s3ClientTest, fileKey);

			const [before] = await tx
				.select({ updatedAt: workspaces.updatedAt })
				.from(workspaces)
				.where(eq(workspaces.id, workspaceId));

			await confirmLogoUploadHandler({
				command: { workspaceId, fileKey },
				workspaceRepository: workspaceDrizzleRepository(tx),
				storageService,
			});

			const [after] = await tx
				.select({ updatedAt: workspaces.updatedAt })
				.from(workspaces)
				.where(eq(workspaces.id, workspaceId));

			expect(after?.updatedAt.getTime()).toBeGreaterThanOrEqual(
				before?.updatedAt.getTime() as number,
			);
		});
	});

	test("Should complete the full end-to-end flow: generate URL, upload, confirm, and persist", async () => {
		await runTestInTransaction(async (tx) => {
			const userId = await seedUser(tx);
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId, workspaceId });

			const repository = workspaceDrizzleRepository(tx);

			const { LogoUploadUrlHandler } = await import("./logo-upload-url");

			const uploadUrlResult = await LogoUploadUrlHandler(
				{ workspaceId, mimeType: "image/jpeg", fileExtension: "jpg" },
				storageService,
				repository,
			);

			expect(uploadUrlResult.isSuccess).toBeTrue();

			const { uploadUrl, workspaceKey } = uploadUrlResult.value;

			const uploadResponse = await fetch(uploadUrl, {
				method: "PUT",
				headers: { "Content-Type": "image/jpeg" },
				body: new Blob([JPEG_BYTES], { type: "image/jpeg" }),
			});

			expect(uploadResponse.ok).toBeTrue();

			const confirmResult = await confirmLogoUploadHandler({
				command: { workspaceId, fileKey: workspaceKey },
				workspaceRepository: repository,
				storageService,
			});

			expect(confirmResult.isSuccess).toBeTrue();

			const [workspace] = await tx
				.select({ companyLogoKey: workspaces.companyLogoKey })
				.from(workspaces)
				.where(eq(workspaces.id, workspaceId));

			expect(workspace?.companyLogoKey).toBe(workspaceKey);
		});
	});
});
