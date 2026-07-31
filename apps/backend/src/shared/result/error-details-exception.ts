import type { ErrorDetails } from "./error-details";

export class ErrorDetailsException extends Error {
	private constructor(
		public readonly errorDetails: ErrorDetails,
		public override readonly cause?: unknown,
	) {
		super(errorDetails.message);
		this.name = "ErrorDetailsException";

		Object.setPrototypeOf(this, new.target.prototype);
	}

	static of(errorDetails: ErrorDetails, cause?: unknown) {
		return new ErrorDetailsException(errorDetails, cause);
	}
}
