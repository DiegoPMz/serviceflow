import { ErrorDetails } from "@serviceflow/backend/shared/result";

export const workspaceMemberErrors = {
	WORKSPACE_ID_REQUIRED: new ErrorDetails(
		"MEMBER_WORKSPACE_ID_REQUIRED",
		"El ID del workspace es requerido para crear la membresía.",
		400,
	),
	USER_ID_REQUIRED: new ErrorDetails(
		"MEMBER_USER_ID_REQUIRED",
		"El ID del usuario es requerido para crear la membresía.",
		400,
	),
	INVALID_ROLE: new ErrorDetails(
		"MEMBER_INVALID_ROLE",
		"El rol asignado al miembro no es válido.",
		400,
	),
	NOT_A_MEMBER: new ErrorDetails(
		"NOT_A_MEMBER",
		"No perteneces a este workspace o el recurso no existe.",
		404,
	),
	INSUFFICIENT_PERMISSIONS: new ErrorDetails(
		"INSUFFICIENT_PERMISSIONS",
		"No tienes los permisos necesarios para realizar esta acción en el workspace.",
		403,
	),
	USER_ALREADY_MEMBER: new ErrorDetails(
		"USER_ALREADY_MEMBER",
		"El usuario ya es miembro de este espacio de trabajo.",
		400,
	),
};
