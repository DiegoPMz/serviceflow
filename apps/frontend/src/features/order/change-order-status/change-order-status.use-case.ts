import type { Eden } from "@/shared/http/client";
import { normalizeEdenError } from "@/shared/lib/normalize-eden-error";
import type { FinalOrderStatus } from "../order-details";

export interface ChangeOrderStatusUseCaseInput {
	workspaceId: string;
	orderId: string;
	status: FinalOrderStatus;
	eden: Eden;
}

export async function changeOrderStatus({
	workspaceId,
	orderId,
	status,
	eden,
}: ChangeOrderStatusUseCaseInput): Promise<void> {
	const { error } = await eden.v1
		.workspaces({ workspaceId })
		.orders({ orderId })
		.status.patch({ status });

	if (error) normalizeEdenError(error);
}
