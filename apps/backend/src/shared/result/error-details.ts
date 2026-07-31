export class ErrorDetails {
	public readonly timestamp: string;

	constructor(
		public readonly code: string,
		public readonly message: string,
		public readonly statusCode: number = 400,
		public readonly details?: Record<string, unknown>,
	) {
		this.timestamp = new Date().toISOString();
	}
}
