export type WorkspaceRole = "owner" | "admin" | "technician" | "viewer";

export type AssignableWorkspaceRole = Exclude<WorkspaceRole, "owner">;

export const WORKSPACE_ROLES: readonly WorkspaceRole[] = [
	"owner",
	"admin",
	"technician",
	"viewer",
];

export const ASSIGNABLE_WORKSPACE_ROLES: readonly AssignableWorkspaceRole[] = [
	"viewer",
	"technician",
	"admin",
];

export const WORKSPACE_ROLE_LABELS: Record<WorkspaceRole, string> = {
	owner: "Propietario",
	admin: "Administrador",
	technician: "Técnico",
	viewer: "Lector",
};
