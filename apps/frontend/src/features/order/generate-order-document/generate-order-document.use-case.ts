import { ORDER_ERROR_CODES } from "@serviceflow/error-codes";
import type { Eden } from "@/shared/http/client";
import { ApiError } from "@/shared/lib/api-error";
import { normalizeEdenError } from "@/shared/lib/normalize-eden-error";

export interface GenerateOrderDocumentUseCaseInput {
	workspaceId: string;
	orderId: string;
	deviceImageBase64: string;
	clientSignatureBase64: string;
	eden: Eden;
}

export async function generateOrderDocument({
	workspaceId,
	orderId,
	deviceImageBase64,
	clientSignatureBase64,
	eden,
}: GenerateOrderDocumentUseCaseInput): Promise<void> {
	const { error } = await eden.v1
		.workspaces({ workspaceId })
		.orders({ orderId })
		.document.post({
			deviceImageBase64,
			clientSignatureBase64,
		});

	if (error) {
		try {
			normalizeEdenError(error);
		} catch (cause) {
			// Un reintento después de una respuesta perdida devuelve 409 porque el
			// documento ya se generó y subió correctamente.
			if (
				cause instanceof ApiError &&
				cause.code === ORDER_ERROR_CODES.DOCUMENT_ALREADY_EXISTS
			) {
				return;
			}

			throw cause;
		}
	}
}
