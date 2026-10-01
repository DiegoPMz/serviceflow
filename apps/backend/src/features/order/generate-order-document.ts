import { storageKeys } from "@serviceflow/backend/shared/object-storage/storage-keys";
import type {
	PrivateDocumentStorage,
	PublicAssetStorage,
} from "@serviceflow/backend/shared/object-storage/storage-service";
import { Created, Result } from "@serviceflow/backend/shared/result";
import { workspaceErrors } from "../workspace/common/workspace.errors";
import type { WorkspaceRepository } from "../workspace/common/workspace-repository";
import { OrderErrors } from "./common/order.errors";
import type { OrderRepository } from "./common/order-repository";
import type { PdfGenerator } from "./common/pdf-generator";

interface GenerateOrderDocumentCommand {
	orderId: string;
	deviceImageBase64: string;
	clientSignatureBase64: string;
}

interface GenerateOrderDocumentProps {
	command: GenerateOrderDocumentCommand;
	orderRepository: OrderRepository;
	workspaceRepository: WorkspaceRepository;
	pdfGenerator: PdfGenerator;
	publicAssetStorage: PublicAssetStorage;
	privateDocumentStorage: PrivateDocumentStorage;
}

export const generateOrderDocumentHandler = async ({
	command,
	orderRepository,
	workspaceRepository,
	pdfGenerator,
	publicAssetStorage,
	privateDocumentStorage,
}: GenerateOrderDocumentProps): Promise<Result<Created>> => {
	const order = await orderRepository.getById(command.orderId);

	if (!order) {
		return Result.failure(OrderErrors.ORDER_NOT_FOUND);
	}

	const workspace = await workspaceRepository.getById(order.workspaceId);

	if (!workspace) {
		return Result.failure(workspaceErrors.WORKSPACE_NOT_FOUND);
	}

	if (order.documentKey) {
		return Result.failure(OrderErrors.ORDER_DOCUMENT_ALREADY_EXISTS);
	}

	let logoBase64: string | undefined;

	if (workspace.company.logoKey) {
		logoBase64 = await publicAssetStorage.getFileBase64(
			workspace.company.logoKey,
		);
	}

	const pdfBuffer = await pdfGenerator.generate(order, workspace.company, {
		deviceImageBase64: command.deviceImageBase64,
		signatureImageBase64: command.clientSignatureBase64,
		companyLogoImageBase64: logoBase64,
	});

	const orderDocumentKey = storageKeys.orderDocument(
		order.workspaceId,
		order.id,
	);

	await privateDocumentStorage.upload({
		key: orderDocumentKey,
		body: pdfBuffer,
		contentType: "application/pdf",
	});

	const attachKeyResult = order.attachDocumentKey(orderDocumentKey);

	if (attachKeyResult.isFailure) {
		return Result.failure(attachKeyResult.error);
	}

	await orderRepository.update(order);
	return Created.toResult();
};
