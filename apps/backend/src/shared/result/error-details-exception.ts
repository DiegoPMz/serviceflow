import type { ErrorDetails } from "./error-details";

export class ErrorDetailsException extends Error {
	constructor(
		public readonly errorDetails: ErrorDetails,
		public override readonly cause?: unknown,
	) {
		super(errorDetails.message);
		this.name = "ErrorDetailsException";

		Object.setPrototypeOf(this, new.target.prototype);
	}
}
