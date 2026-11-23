import type { AssignableWorkspaceRole, WorkspaceRole } from "./workspace-role";

/**
 * Política de equipo derivada del rol del usuario actual.
 * Única fuente de verdad para tabs, invitaciones y acciones sobre miembros.
 */
export interface TeamPolicy {
	/** owner/admin: puede ver invitaciones, invitar y gestionar el equipo. */
	canManageTeam: boolean;
	/** Roles que el usuario actual puede asignar (al invitar o cambiar rol). */
	invitableRoles: readonly AssignableWorkspaceRole[];
	/** ¿Puede gestionar (cambiar rol / eliminar) a un miembro con este rol? */
	canManage: (memberRole: WorkspaceRole) => boolean;
}

export function getTeamPolicy(currentRole: WorkspaceRole): TeamPolicy {
	switch (currentRole) {
		case "owner":
			return {
				canManageTeam: true,
				invitableRoles: ["admin", "technician", "viewer"],
				canManage: (memberRole) => memberRole !== "owner",
			};

		case "admin":
			return {
				canManageTeam: true,
				invitableRoles: ["technician", "viewer"],
				canManage: (memberRole) =>
					memberRole === "technician" || memberRole === "viewer",
			};

		case "technician":
		case "viewer":
			return {
				canManageTeam: false,
				invitableRoles: [],
				canManage: () => false,
			};
	}
}
