import type { Static } from "@sinclair/typebox";
import { paginationRequestSchema } from "../shared/pagination.schema";

export const listUsersQuerySchema = paginationRequestSchema({
	orderBy: [
		"id",
		"name",
		"lastName",
		"email",
		"createdAt",
		"updatedAt",
	] as const,
	defaultLimit: 20,
	defaultDirection: "desc",
});

export type ListUsersQuery = Static<typeof listUsersQuerySchema>;
