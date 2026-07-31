import type { Context } from "elysia";
import type { ErrorDetails } from "../result";
import type { ApiErrorResponse, ApiSuccessResponse } from "./api-response";

function isEmptyObject(val: unknown): boolean {
	return (
		typeof val === "object" &&
		val !== null &&
		!Array.isArray(val) &&
		Object.keys(val).length === 0
	);
}

export const respond = {
	success: <T>(
		value: T | null = null,
		set?: Context["set"],
		status: number = 200,
	): ApiSuccessResponse<T> => {
		if (set) set.status = status;

		const isDataEmpty =
			value === null || value === undefined || isEmptyObject(value);

		return {
			success: true,
			data: isDataEmpty ? null : (value as T),
		};
	},

	failure: (
		error: ErrorDetails,
		set?: Context["set"],
		status?: number,
	): ApiErrorResponse => {
		if (set) set.status = status ?? error.statusCode;

		return {
			success: false,
			error: {
				code: error.code,
				message: error.message,
				details: error.details,
				timestamp: error.timestamp,
			},
		};
	},
};
