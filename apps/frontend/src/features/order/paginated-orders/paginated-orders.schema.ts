import * as v from "valibot";

export const PaginatedOrdersSchema = v.object({
	page: v.optional(v.number()),
	search: v.optional(v.pipe(v.string(), v.nonEmpty())),
	status: v.optional(
		v.union([
			v.literal("pendiente"),
			v.literal("entregada"),
			v.literal("cancelada"),
		]),
	),
});

export type PaginatedOrderInput = v.InferInput<typeof PaginatedOrdersSchema>;
