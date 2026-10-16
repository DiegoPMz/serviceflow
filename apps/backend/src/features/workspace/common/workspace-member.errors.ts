import { ErrorDetails } from "@serviceflow/backend/shared/result";
import { WORKSPACE_ERROR_CODES } from "@serviceflow/error-codes";

export const workspaceMemberErrors = {
	WORKSPACE_ID_REQUIRED: new ErrorDetails(
		WORKSPACE_ERROR_CODES.MEMBER_WORKSPACE_ID_REQUIRED,
		"El ID del workspace es requerido para crear la membresía.",
		400,
	),
	USER_ID_REQUIRED: new ErrorDetails(
		WORKSPACE_ERROR_CODES.MEMBER_USER_ID_REQUIRED,
		"El ID del usuario es requerido para crear la membresía.",
		400,
	),
	INVALID_ROLE: new ErrorDetails(
		WORKSPACE_ERROR_CODES.MEMBER_INVALID_ROLE,
		"El rol asignado al miembro no es válido.",
		400,
	),
	NOT_A_MEMBER: new ErrorDetails(
		WORKSPACE_ERROR_CODES.NOT_A_MEMBER,
		"No perteneces a este workspace o el recurso no existe.",
		404,
	),
	INSUFFICIENT_PERMISSIONS: new ErrorDetails(
		WORKSPACE_ERROR_CODES.INSUFFICIENT_PERMISSIONS,
		"No tienes los permisos necesarios para realizar esta acción en el workspace.",
		403,
	),
	USER_ALREADY_MEMBER: new ErrorDetails(
		WORKSPACE_ERROR_CODES.USER_ALREADY_MEMBER,
		"El usuario ya es miembro de este espacio de trabajo.",
		400,
	),
	CANNOT_CHANGE_OWNER_ROLE: new ErrorDetails(
		WORKSPACE_ERROR_CODES.CANNOT_CHANGE_OWNER_ROLE,
		"El rol del propietario del workspace no se puede modificar directamente.",
		400,
	),
	// Cuando intentas promover a alguien a OWNER
	CANNOT_ASSIGN_OWNER_ROLE: new ErrorDetails(
		WORKSPACE_ERROR_CODES.CANNOT_ASSIGN_OWNER_ROLE,
		"No se puede asignar el rol de propietario mediante un cambio de rol tradicional.",
		400,
	),
	CANNOT_REMOVE_OWNER: new ErrorDetails(
		WORKSPACE_ERROR_CODES.CANNOT_REMOVE_OWNER,
		"El propietario del workspace no puede ser eliminado.",
		400,
	),
	CANNOT_REMOVE_SELF: new ErrorDetails(
		WORKSPACE_ERROR_CODES.CANNOT_REMOVE_SELF,
		"No puedes eliminarte a ti mismo del workspace.",
		400,
	),
	ONLY_OWNER_CAN_REMOVE_ADMIN: new ErrorDetails(
		WORKSPACE_ERROR_CODES.ONLY_OWNER_CAN_REMOVE_ADMIN,
		"Solo el propietario del workspace puede eliminar a un administrador.",
		403,
	),
	ALREADY_REJECTED: new ErrorDetails(
		WORKSPACE_ERROR_CODES.INVITATION_ALREADY_REJECTED,
		"La invitación ya ha sido rechazada.",
		400,
	),
	CANNOT_CANCEL_REJECTED: new ErrorDetails(
		WORKSPACE_ERROR_CODES.INVITATION_CANNOT_CANCEL_REJECTED,
		"No se puede cancelar una invitación que ya fue rechazada por el usuario.",
		400,
	),
};
