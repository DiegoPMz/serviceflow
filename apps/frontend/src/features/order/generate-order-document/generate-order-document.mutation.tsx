import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@/shared/lib/api-error";
import {
	type GenerateOrderDocumentUseCaseInput,
	generateOrderDocument,
} from "./generate-order-document.use-case";

const MAX_RETRIES = 2;

function getErrorStatus(error: unknown): number | null {
	if (error instanceof ApiError) {
		return error.statusCode;
	}

	if (typeof error === "object" && error !== null && "status" in error) {
		const status = (error as { status?: unknown }).status;
		return typeof status === "number" ? status : null;
	}

	return null;
}

function shouldRetry(failureCount: number, error: unknown): boolean {
	if (failureCount >= MAX_RETRIES) {
		return false;
	}

	const status = getErrorStatus(error);

	// Errores de red o respuestas que no pudieron normalizarse.
	if (status === null) {
		return true;
	}

	return status === 408 || status === 429 || status >= 500;
}

export function useGenerateOrderDocument() {
	return useMutation({
		mutationFn: (variables: GenerateOrderDocumentUseCaseInput) =>
			generateOrderDocument(variables),
		retry: shouldRetry,
		retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 4000),
	});
}
