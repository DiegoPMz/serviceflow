import type { Treaty } from "@elysia/eden/treaty2";
import type { Eden } from "@/shared/http/client";

type WorkspacesApi = ReturnType<Eden["v1"]["workspaces"]>;

export type PaginatedWorkspaceMembers = Treaty.Data<
	WorkspacesApi["members"]["get"]
>;

/** Elemento del listado paginado de miembros de un workspace. */
export type WorkspaceMemberListItem =
	PaginatedWorkspaceMembers["items"][number];
