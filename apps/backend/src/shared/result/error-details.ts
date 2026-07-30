import { ErrorDetailsException } from "./error-details-exception";

export class ErrorDetails {
	public readonly timestamp: string;

	constructor(
		public readonly code: string,
		public readonly message: string,
		public readonly statusCode: number = 400,
		public readonly details?: Record<string, unknown> | unknown[],
	) {
		this.timestamp = new Date().toISOString();
	}

	public toException(cause?: unknown): ErrorDetailsException {
		return new ErrorDetailsException(this, cause);
	}
}
