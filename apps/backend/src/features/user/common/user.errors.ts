import { ErrorDetails } from "@serviceflow/backend/shared/result";

export const UserErrors = {
	USER_EXTERNAL_ID_REQUIRED: new ErrorDetails(
		"USER_EXTERNAL_ID_REQUIRED",
		"El ID externo del usuario es requerido.",
	),
	USER_EMAIL_REQUIRED: new ErrorDetails(
		"USER_EMAIL_REQUIRED",
		"El email del usuario es requerido.",
	),
	USER_EMAIL_INVALID: new ErrorDetails(
		"USER_EMAIL_INVALID",
		"El email del usuario no tiene un formato válido.",
	),
	USER_EMAIL_TOO_LONG: new ErrorDetails(
		"USER_EMAIL_TOO_LONG",
		"El email del usuario no puede exceder 200 caracteres.",
	),
	USER_NAME_REQUIRED: new ErrorDetails(
		"USER_NAME_REQUIRED",
		"El nombre del usuario es requerido.",
	),
	USER_NAME_TOO_LONG: new ErrorDetails(
		"USER_NAME_TOO_LONG",
		"El nombre del usuario no puede exceder 100 caracteres.",
	),
	USER_LAST_NAME_EMPTY: new ErrorDetails(
		"USER_LAST_NAME_EMPTY",
		"El apellido del usuario no puede estar vacío.",
	),
	USER_LAST_NAME_TOO_LONG: new ErrorDetails(
		"USER_LAST_NAME_TOO_LONG",
		"El apellido del usuario no puede exceder 100 caracteres.",
	),
	USER_PHONE_INVALID: new ErrorDetails(
		"USER_PHONE_INVALID",
		"El teléfono del usuario debe tener formato E.164 (ej. +5215551234567).",
	),
	USER_PHONE_TOO_LONG: new ErrorDetails(
		"USER_PHONE_TOO_LONG",
		"El teléfono del usuario no puede exceder 20 caracteres.",
	),
	USER_NOT_FOUND: new ErrorDetails(
		"USER_NOT_FOUND",
		"El usuario especificado no fue encontrado.",
	),
} as const;
