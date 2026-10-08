import { type Static, Type } from "@sinclair/typebox";
import { orderStatusFilterSchema } from "./order.primitives";

export const listOrdersQuerySchema = Type.Object({
	page: Type.Number({ minimum: 1 }),
	pageSize: Type.Number({ minimum: 1, maximum: 30 }),
	search: Type.Optional(Type.String({ maxLength: 500 })),
	status: Type.Optional(orderStatusFilterSchema),
	direction: Type.Optional(
		Type.Union([Type.Literal("asc"), Type.Literal("desc")]),
	),
});

export type ListOrdersQuery = Static<typeof listOrdersQuerySchema>;
