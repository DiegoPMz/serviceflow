import { type Static, Type } from "@sinclair/typebox";
import { paginationRequestSchema } from "../shared/pagination.schema";

export const listDeviceComponentsQuerySchema = Type.Composite([
	paginationRequestSchema({
		orderBy: ["id", "name", "partNumber", "type", "createdAt"] as const,
		defaultLimit: 20,
		defaultDirection: "asc",
	}),
]);

export type ListDeviceComponentsQuery = Static<
	typeof listDeviceComponentsQuerySchema
>;
