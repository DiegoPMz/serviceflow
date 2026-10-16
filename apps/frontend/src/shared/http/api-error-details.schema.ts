import * as v from "valibot";

export const ApiErrorDetailsSchema = v.object({
	code: v.string(),
	message: v.string(),
	statusCode: v.number(),
	timestamp: v.string(),
	details: v.optional(v.record(v.string(), v.unknown())),
});

export type ApiErrorDetails = v.InferOutput<typeof ApiErrorDetailsSchema>;
