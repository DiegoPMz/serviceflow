import type { StorageService } from "@serviceflow/backend/shared/object-storage/storage-service";
import { Result } from "@serviceflow/backend/shared/result";
import { OrderErrors } from "./common/order.errors";
import type { OrderRepository } from "./common/order-repository";

interface GetOrderDocumentQuery {
	orderId: string;
}

interface GetOrderDocumentProps {
	query: GetOrderDocumentQuery;
	storageService: StorageService;
	orderRepository: OrderRepository;
}

export const GetOrderDocumentHandler = async ({
	storageService,
	orderRepository,
	query,
}: GetOrderDocumentProps): Promise<Result<{ signedDownloadUrl: string }>> => {
	const order = await orderRepository.getById(query.orderId);

	if (!order) {
		return Result.failure(OrderErrors.ORDER_NOT_FOUND);
	}

	if (!order.documentKey) {
		return Result.failure(OrderErrors.ORDER_DOCUMENT_NOT_GENERATED);
	}

	const signedDownloadUrl = await storageService.createSignedDownloadUrl({
		key: order.documentKey,
		expiresIn: 60 * 5,
		fileName: order.folio,
	});

	return Result.success({ signedDownloadUrl });
};
