import type { Static } from "@sinclair/typebox";
import { paginationRequestSchema } from "../shared/pagination.schema";

export const listClientsQuerySchema = paginationRequestSchema({
	orderBy: ["name", "phone", "email", "id"] as const,
	defaultLimit: 20,
	defaultDirection: "asc",
});

export type ListClientsQuery = Static<typeof listClientsQuerySchema>;
