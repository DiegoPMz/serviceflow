import * as v from "valibot";
import { ApiErrorDetailsSchema } from "../http/api-error-details.schema";
import { toApiError } from "./api-error";

export function normalizeEdenError<T>(error: {
	value: T;
	status: number;
}): never {
	const result = v.safeParse(ApiErrorDetailsSchema, error.value);

	if (result.success) {
		throw toApiError(result.output);
	}

	throw error;
}
