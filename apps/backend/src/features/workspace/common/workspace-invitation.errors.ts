import { ErrorDetails } from "@serviceflow/backend/shared/result";

export const workspaceInvitationErrors = {
	WORKSPACE_ID_REQUIRED: new ErrorDetails(
		"INVITATION_WORKSPACE_ID_REQUIRED",
		"El ID del workspace es requerido para generar la invitación.",
		400,
	),
	INVALID_EMAIL: new ErrorDetails(
		"INVITATION_INVALID_EMAIL",
		"El correo electrónico ingresado para la invitación no es válido.",
		400,
	),
	INVALID_ROLE: new ErrorDetails(
		"INVITATION_INVALID_ROLE",
		"El rol asignado a la invitación no es válido.",
		400,
	),
	INVALID_EXPIRATION_DAYS: new ErrorDetails(
		"INVITATION_INVALID_EXPIRATION_DAYS",
		"Los días de expiración de la invitación deben ser al menos 1 día.",
		400,
	),
	NOT_FOUND: new ErrorDetails(
		"INVITATION_NOT_FOUND",
		"La invitación no existe o ha sido cancelada.",
		404,
	),
	EXPIRED: new ErrorDetails(
		"INVITATION_EXPIRED",
		"La invitación ha expirado. Solicita al administrador que te reenvíe una nueva.",
		400,
	),
	EMAIL_MISMATCH: new ErrorDetails(
		"INVITATION_EMAIL_MISMATCH",
		"Esta invitación fue enviada a un correo electrónico diferente al de tu cuenta.",
		403,
	),
	ALREADY_MEMBER: new ErrorDetails(
		"INVITATION_USER_ALREADY_MEMBER",
		"El usuario ya es miembro activo de este espacio de trabajo.",
		400,
	),
	ALREADY_ACCEPTED: new ErrorDetails(
		"INVITATION_ALREADY_ACCEPTED",
		"La invitación ya ha sido aceptada previamente.",
		400,
	),
	ALREADY_CANCELLED: new ErrorDetails(
		"INVITATION_ALREADY_CANCELLED",
		"La invitación ya ha sido cancelada.",
		400,
	),
	CANNOT_CANCEL_ACCEPTED: new ErrorDetails(
		"INVITATION_CANNOT_CANCEL_ACCEPTED",
		"No se puede cancelar una invitación que ya fue aceptada.",
		400,
	),
	CANNOT_RENEW_NON_PENDING: new ErrorDetails(
		"INVITATION_CANNOT_RENEW_NON_PENDING",
		"Solo se pueden renovar invitaciones que estén en estado pendiente.",
		400,
	),
	ALREADY_REJECTED: new ErrorDetails(
		"INVITATION_ALREADY_REJECTED",
		"La invitación ya ha sido rechazada.",
		400,
	),
	CANNOT_CANCEL_REJECTED: new ErrorDetails(
		"INVITATION_CANNOT_CANCEL_REJECTED",
		"No se puede cancelar una invitación que ya fue rechazada por el usuario.",
		400,
	),
};
