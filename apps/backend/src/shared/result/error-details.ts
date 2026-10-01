export type StatusCode = 401 | 403 | 400 | 404 | 409 | 500 | 502 | 422;

export class ErrorDetails {
	public readonly timestamp: string;

	constructor(
		public readonly code: string,
		public readonly message: string,
		public readonly statusCode: StatusCode = 400,
		public readonly details?: Record<string, unknown>,
	) {
		this.timestamp = new Date().toISOString();
	}
}
