import { useCallback, useState } from "react";
import { useChangeOrderStatus } from "@/features/order/change-order-status";
import type { FinalOrderStatus } from "@/features/order/order-details";
import type { Eden } from "@/shared/http/client";
import { ApiError } from "@/shared/lib/api-error";

interface UseOrderStatusChangeInput {
	eden: Eden;
	workspaceId: string;
	orderId: string;
}

export function useOrderStatusChange({
	eden,
	workspaceId,
	orderId,
}: UseOrderStatusChangeInput) {
	const { isPending, mutateAsync } = useChangeOrderStatus();
	const [requestedStatus, setRequestedStatus] =
		useState<FinalOrderStatus | null>(null);
	const [statusError, setStatusError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const requestStatusChange = useCallback((status: FinalOrderStatus) => {
		setStatusError(null);
		setRequestedStatus(status);
	}, []);

	const confirmStatusChange = useCallback(async () => {
		if (!requestedStatus || isSubmitting || isPending) return;

		setIsSubmitting(true);
		setStatusError(null);

		try {
			await mutateAsync({
				workspaceId,
				orderId,
				status: requestedStatus,
				eden,
			});

			setRequestedStatus(null);
		} catch (error) {
			setStatusError(
				error instanceof ApiError
					? error.message
					: "No se pudo actualizar el estado de la orden. Inténtalo nuevamente.",
			);
		} finally {
			setIsSubmitting(false);
		}
	}, [
		eden,
		isPending,
		isSubmitting,
		mutateAsync,
		orderId,
		requestedStatus,
		workspaceId,
	]);

	const handleDialogOpenChange = useCallback((open: boolean) => {
		if (open) return;

		setRequestedStatus(null);
		setStatusError(null);
	}, []);

	return {
		confirmStatusChange,
		handleDialogOpenChange,
		isUpdating: isSubmitting || isPending,
		requestStatusChange,
		requestedStatus,
		statusError,
	};
}
