import type { Static } from "@sinclair/typebox";
import { paginationRequestSchema } from "../shared/pagination.schema";

export const listWorkspaceMembersQuerySchema = paginationRequestSchema({
	orderBy: ["joinedAt", "name", "email"] as const,
	defaultLimit: 20,
	defaultDirection: "desc",
});

export type ListWorkspaceMembersQuery = Static<
	typeof listWorkspaceMembersQuerySchema
>;
