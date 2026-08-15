import { type Static, Type } from "@sinclair/typebox";
import { paginationRequestSchema } from "../shared/pagination.schema";
import { orderStatusFilterSchema } from "./order.primitives";

export const listOrdersQuerySchema = Type.Composite([
	paginationRequestSchema({
		orderBy: [
			"id",
			"folio",
			"createdAt",
			"updatedAt",
			"clientName",
			"deviceBrand",
			"status",
			"userName",
		] as const,
		defaultLimit: 20,
		defaultDirection: "desc",
	}),
	Type.Object({
		status: Type.Optional(orderStatusFilterSchema),
	}),
]);

export type ListOrdersQuery = Static<typeof listOrdersQuerySchema>;
