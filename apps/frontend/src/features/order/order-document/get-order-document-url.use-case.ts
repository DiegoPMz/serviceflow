import type { Eden } from "@/shared/http/client";
import { normalizeEdenError } from "@/shared/lib/normalize-eden-error";

export interface GetOrderDocumentUrlUseCaseInput {
	workspaceId: string;
	orderId: string;
	eden: Eden;
}

export async function getOrderDocumentUrl({
	workspaceId,
	orderId,
	eden,
}: GetOrderDocumentUrlUseCaseInput): Promise<string> {
	const { data, error } = await eden.v1
		.workspaces({ workspaceId })
		.orders({ orderId })
		.document.get();

	if (error) normalizeEdenError(error);

	return data.signedDownloadUrl;
}
