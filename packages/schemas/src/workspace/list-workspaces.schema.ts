import type { Static } from "@sinclair/typebox";
import { paginationRequestSchema } from "../shared/pagination.schema";

export const listWorkspacesQuerySchema = paginationRequestSchema({
	orderBy: ["updatedAt", "name", "id"] as const,
	defaultLimit: 20,
});

export type ListWorkspacesQuery = Static<typeof listWorkspacesQuerySchema>;
