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
	GetObjectCommand,
	ListObjectsV2Command,
	type S3Client,
} from "@aws-sdk/client-s3";
import { seedClient } from "@serviceflow/backend/shared/database/seeds/client.seeds";
import { seedDevice } from "@serviceflow/backend/shared/database/seeds/device.seeds";
import { seedOrder } from "@serviceflow/backend/shared/database/seeds/order.seeds";
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
import { workspaceDrizzleRepository } from "../workspace/common/workspace-drizzle-repository";
import { OrderErrors } from "./common/order.errors";
import { OrderDrizzleRepository } from "./common/order-drizzle-repository";
import { PdfMakeOrderPdfGenerator } from "./common/pdfMake-pdf-generator";
import { generateOrderDocumentCommandHandler } from "./generate-order-document";

describe("GenerateOrderDocument Integration Tests", () => {
	let storageService: StorageService;
	let s3ClientTest: S3Client;

	const ONE_PIXEL_PNG =
		"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

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
		const objects = await s3ClientTest.send(
			new ListObjectsV2Command({
				Bucket: BUCKET_TEST_NAME,
			}),
		);

		if (!objects.Contents?.length) {
			return;
		}

		await s3ClientTest.send(
			new DeleteObjectsCommand({
				Bucket: BUCKET_TEST_NAME,
				Delete: {
					Objects: objects.Contents.map((o) => ({
						Key: o.Key!,
					})),
				},
			}),
		);
	});

	afterAll(async () => {
		await stopTestContainer();
	});

	test("Should generate and upload the order document", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);

			const client = await seedClient(tx, { workspaceId });
			const device = await seedDevice(tx, { workspaceId, clientId: client.id });
			const userId = await seedUser(tx);
			await addMember(tx, {
				userId,
				workspaceId,
			});

			const orderId = await seedOrder(tx, {
				workspaceId,
				clientId: client.id,
				deviceId: device.id,
				userId,
			});

			const result = await generateOrderDocumentCommandHandler({
				command: {
					orderId,
					deviceImageBase64: ONE_PIXEL_PNG,
					clientSignatureBase64: ONE_PIXEL_PNG,
				},
				orderRepository: OrderDrizzleRepository(tx),
				workspaceRepository: workspaceDrizzleRepository(tx),
				pdfGenerator: PdfMakeOrderPdfGenerator,
				storageService,
			});

			expect(result.isSuccess).toBeTrue();

			const order = await OrderDrizzleRepository(tx).getById(orderId);

			expect(order?.documentKey).toBe(
				storageKeys.orderDocument(workspaceId, orderId),
			);

			const object = await s3ClientTest.send(
				new GetObjectCommand({
					Bucket: BUCKET_TEST_NAME,
					Key: order!.documentKey!,
				}),
			);

			expect(object.ContentType).toBe("application/pdf");
			expect(object.ContentLength).toBeGreaterThan(0);

			const bytes = await object.Body!.transformToByteArray();

			expect(Buffer.from(bytes).subarray(0, 4).toString()).toBe("%PDF");
		});
	});

	test("Should return ORDER_NOT_FOUND", async () => {
		await runTestInTransaction(async (tx) => {
			const result = await generateOrderDocumentCommandHandler({
				command: {
					orderId: crypto.randomUUID(),
					deviceImageBase64: ONE_PIXEL_PNG,
					clientSignatureBase64: ONE_PIXEL_PNG,
				},
				orderRepository: OrderDrizzleRepository(tx),
				workspaceRepository: workspaceDrizzleRepository(tx),
				pdfGenerator: PdfMakeOrderPdfGenerator,
				storageService,
			});

			expect(result.isFailure).toBeTrue();
			expect(result.error).toBe(OrderErrors.ORDER_NOT_FOUND);
		});
	});

	test("Should return ORDER_DOCUMENT_ALREADY_EXISTS", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const client = await seedClient(tx, { workspaceId });
			const device = await seedDevice(tx, { workspaceId, clientId: client.id });
			const userId = await seedUser(tx);
			await addMember(tx, {
				userId,
				workspaceId,
			});

			const orderId = await seedOrder(tx, {
				workspaceId,
				clientId: client.id,
				deviceId: device.id,
				userId,
				documentKey: storageKeys.orderDocument(workspaceId, "existing"),
			});

			const result = await generateOrderDocumentCommandHandler({
				command: {
					orderId,
					deviceImageBase64: ONE_PIXEL_PNG,
					clientSignatureBase64: ONE_PIXEL_PNG,
				},
				orderRepository: OrderDrizzleRepository(tx),
				workspaceRepository: workspaceDrizzleRepository(tx),
				pdfGenerator: PdfMakeOrderPdfGenerator,
				storageService,
			});

			expect(result.isFailure).toBeTrue();
			expect(result.error).toBe(OrderErrors.ORDER_DOCUMENT_ALREADY_EXISTS);
		});
	});
});
