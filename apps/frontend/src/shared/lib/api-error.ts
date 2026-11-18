import type { ApiErrorDetails } from "../http/api-error-details.schema";

export class ApiError extends Error {
	constructor(
		public readonly code: string,
		message: string,
		public readonly statusCode: number,
		public readonly details?: Record<string, unknown>,
		public readonly timestamp?: string,
	) {
		super(message);
		this.name = "ApiError";
	}
}

export function toApiError(error: ApiErrorDetails): ApiError {
	const timestamp =
		error.timestamp instanceof Date
			? error.timestamp.toISOString()
			: error.timestamp;

	return new ApiError(
		error.code,
		error.message,
		error.statusCode,
		error.details,
		timestamp,
	);
}
