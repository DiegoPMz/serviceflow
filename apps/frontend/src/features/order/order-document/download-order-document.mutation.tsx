import { ORDER_ERROR_CODES } from "@serviceflow/error-codes";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib/api-error";
import {
	type GetOrderDocumentUrlUseCaseInput,
	getOrderDocumentUrl,
} from "./get-order-document-url.use-case";

function triggerBrowserDownload(url: string) {
	const link = document.createElement("a");
	link.href = url;
	link.rel = "noopener noreferrer";
	link.style.display = "none";
	document.body.appendChild(link);
	link.click();
	link.remove();
}

function notifyDownloadError(error: unknown) {
	if (error instanceof ApiError) {
		if (error.code === ORDER_ERROR_CODES.DOCUMENT_NOT_GENERATED) {
			toast.error("Esta orden aún no tiene documento generado.");
			return;
		}

		if (error.code === ORDER_ERROR_CODES.NOT_FOUND) {
			toast.error("La orden ya no existe.");
			return;
		}
	}

	toast.error("No pudimos descargar el documento de la orden.");
}

export function useDownloadOrderDocument() {
	return useMutation({
		mutationFn: async (input: GetOrderDocumentUrlUseCaseInput) => {
			const signedUrl = await getOrderDocumentUrl(input);
			triggerBrowserDownload(signedUrl);
		},
		onError: notifyDownloadError,
	});
}
