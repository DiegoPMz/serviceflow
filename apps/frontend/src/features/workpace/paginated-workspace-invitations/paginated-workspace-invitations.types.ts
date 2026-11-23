import type { Treaty } from "@elysia/eden/treaty2";
import type { Eden } from "@/shared/http/client";

type WorkspacesApi = ReturnType<Eden["v1"]["workspaces"]>;

export type PaginatedWorkspaceInvitations = Treaty.Data<
	WorkspacesApi["invitations"]["get"]
>;

/** Elemento del listado paginado de invitaciones de un workspace. */
export type WorkspaceInvitationListItem =
	PaginatedWorkspaceInvitations["items"][number];
