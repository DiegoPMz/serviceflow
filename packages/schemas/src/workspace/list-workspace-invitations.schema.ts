import type { Static } from "@sinclair/typebox";
import { paginationRequestSchema } from "../shared/pagination.schema";

export const listWorkspaceInvitationsQuerySchema = paginationRequestSchema({
	orderBy: ["createdAt"] as const,
	defaultLimit: 20,
	defaultOrderBy: "createdAt",
	defaultDirection: "desc",
});

export type ListWorkspaceInvitationsQuery = Static<
	typeof listWorkspaceInvitationsQuerySchema
>;
