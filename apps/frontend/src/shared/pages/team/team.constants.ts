import type { WorkspaceRole } from "@/features/workpace/common/workspace-role";

export const ROLE_DESCRIPTIONS: Record<WorkspaceRole, string> = {
	owner:
		"Control total del espacio de trabajo: administra roles, miembros e invitaciones.",
	admin: "Administra invitaciones y miembros con rol Técnico o Lector.",
	technician:
		"Opera órdenes, clientes y equipos. Solo lectura del directorio de equipo.",
	viewer:
		"Consulta la información del espacio de trabajo y del equipo sin permisos de edición.",
};
