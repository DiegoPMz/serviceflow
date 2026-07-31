export interface ApiErrorPayload {
	code: string;
	message: string;
	details?: Record<string, unknown>;
	timestamp: string;
}

export interface ApiErrorResponse {
	success: false;
	error: ApiErrorPayload;
}

export interface ApiSuccessResponse<T> {
	success: true;
	data: T | null;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
