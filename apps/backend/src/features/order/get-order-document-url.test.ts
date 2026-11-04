import { describe, expect, test } from "bun:test";
import type { PrivateDocumentStorage } from "@serviceflow/backend/shared/object-storage/storage-service";
import { ORDER_ERROR_CODES } from "@serviceflow/error-codes";
import type { Order } from "./common/order.model";
import type { OrderRepository } from "./common/order-repository";
import { GetOrderDocumentHandler } from "./get-order-document-url";

interface SignedDownloadUrlValues {
	key: string;
	fileName: string;
	expiresIn?: number;
}

const buildOrderRepository = (order: Partial<Order> | null) =>
	({
		getById: () => Promise.resolve(order as Order | null),
	}) as unknown as OrderRepository;

const buildPrivateDocumentStorage = (
	captured: { values?: SignedDownloadUrlValues } = {},
) =>
	({
		createSignedDownloadUrl: (values: SignedDownloadUrlValues) => {
			captured.values = values;
			return Promise.resolve("https://r2.example.com/signed");
		},
	}) as unknown as PrivateDocumentStorage;

describe("GetOrderDocumentHandler", () => {
	test("should request the download with the order folio and the pdf extension", async () => {
		const captured: { values?: SignedDownloadUrlValues } = {};

		const result = await GetOrderDocumentHandler({
			query: { orderId: "order-1" },
			orderRepository: buildOrderRepository({
				folio: "TECFIX-001",
				documentKey: "workspaces/ws-1/orders/order-1/document.pdf",
			}),
			privateDocumentStorage: buildPrivateDocumentStorage(captured),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value).toEqual({
			signedDownloadUrl: "https://r2.example.com/signed",
		});
		expect(captured.values).toEqual({
			key: "workspaces/ws-1/orders/order-1/document.pdf",
			fileName: "TECFIX-001.pdf",
			expiresIn: 300,
		});
	});

	test("should fail when the order does not exist", async () => {
		const result = await GetOrderDocumentHandler({
			query: { orderId: "missing" },
			orderRepository: buildOrderRepository(null),
			privateDocumentStorage: buildPrivateDocumentStorage(),
		});

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(ORDER_ERROR_CODES.NOT_FOUND);
	});

	test("should fail when the order has no generated document", async () => {
		const result = await GetOrderDocumentHandler({
			query: { orderId: "order-1" },
			orderRepository: buildOrderRepository({
				folio: "TECFIX-001",
				documentKey: null,
			}),
			privateDocumentStorage: buildPrivateDocumentStorage(),
		});

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(ORDER_ERROR_CODES.DOCUMENT_NOT_GENERATED);
	});
});
