import { ErrorDetails } from "@serviceflow/backend/shared/result";

export const ClientErrors = {
	CLIENT_NAME_REQUIRED: new ErrorDetails(
		"CLIENT_NAME_REQUIRED",
		"El nombre del cliente es requerido.",
	),
	CLIENT_NAME_TOO_LONG: new ErrorDetails(
		"CLIENT_NAME_TOO_LONG",
		"El nombre del cliente no puede exceder 150 caracteres.",
	),
	CLIENT_EMAIL_REQUIRED: new ErrorDetails(
		"CLIENT_EMAIL_REQUIRED",
		"El email del cliente es requerido.",
	),
	CLIENT_EMAIL_INVALID: new ErrorDetails(
		"CLIENT_EMAIL_INVALID",
		"El email del cliente no tiene un formato válido.",
	),
	CLIENT_EMAIL_TOO_LONG: new ErrorDetails(
		"CLIENT_EMAIL_TOO_LONG",
		"El email del cliente no puede exceder 200 caracteres.",
	),
	CLIENT_PHONE_REQUIRED: new ErrorDetails(
		"CLIENT_PHONE_REQUIRED",
		"El teléfono del cliente es requerido.",
	),
	CLIENT_PHONE_INVALID: new ErrorDetails(
		"CLIENT_PHONE_INVALID",
		"El teléfono del cliente debe tener formato E.164 (ej. +5215551234567).",
	),
	CLIENT_PHONE_TOO_LONG: new ErrorDetails(
		"CLIENT_PHONE_TOO_LONG",
		"El teléfono del cliente no puede exceder 20 caracteres.",
	),
	CLIENT_WORKSPACE_ID_REQUIRED: new ErrorDetails(
		"CLIENT_WORKSPACE_ID_REQUIRED",
		"El ID del workspace es requerido.",
	),
	CLIENT_LOCATION_REQUIRED: new ErrorDetails(
		"CLIENT_LOCATION_REQUIRED",
		"La ubicación del cliente es requerida.",
	),
	CLIENT_ALREADY_EXISTS: new ErrorDetails(
		"CLIENT_ALREADY_EXISTS",
		"Ya existe un cliente con el mismo email o teléfono en este workspace.",
	),
	CLIENT_NOT_FOUND: new ErrorDetails(
		"CLIENT_NOT_FOUND",
		"El cliente especificado no fue encontrado en este workspace.",
	),
} as const;
