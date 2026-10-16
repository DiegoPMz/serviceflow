import { ErrorDetails } from "@serviceflow/backend/shared/result";
import { CLIENT_ERROR_CODES } from "@serviceflow/error-codes";

export const ClientErrors = {
	CLIENT_NAME_REQUIRED: new ErrorDetails(
		CLIENT_ERROR_CODES.NAME_REQUIRED,
		"El nombre del cliente es requerido.",
		400,
	),
	CLIENT_NAME_TOO_LONG: new ErrorDetails(
		CLIENT_ERROR_CODES.NAME_TOO_LONG,
		"El nombre del cliente no puede exceder 150 caracteres.",
		400,
	),
	CLIENT_EMAIL_REQUIRED: new ErrorDetails(
		CLIENT_ERROR_CODES.EMAIL_REQUIRED,
		"El email del cliente es requerido.",
		400,
	),
	CLIENT_EMAIL_INVALID: new ErrorDetails(
		CLIENT_ERROR_CODES.EMAIL_INVALID,
		"El email del cliente no tiene un formato válido.",
		400,
	),
	CLIENT_EMAIL_TOO_LONG: new ErrorDetails(
		CLIENT_ERROR_CODES.EMAIL_TOO_LONG,
		"El email del cliente no puede exceder 200 caracteres.",
		400,
	),
	CLIENT_PHONE_REQUIRED: new ErrorDetails(
		CLIENT_ERROR_CODES.PHONE_REQUIRED,
		"El teléfono del cliente es requerido.",
		400,
	),
	CLIENT_PHONE_INVALID: new ErrorDetails(
		CLIENT_ERROR_CODES.PHONE_INVALID,
		"El teléfono del cliente debe tener formato E.164 (ej. +5215551234567).",
		400,
	),
	CLIENT_PHONE_TOO_LONG: new ErrorDetails(
		CLIENT_ERROR_CODES.PHONE_TOO_LONG,
		"El teléfono del cliente no puede exceder 20 caracteres.",
		400,
	),
	CLIENT_WORKSPACE_ID_REQUIRED: new ErrorDetails(
		CLIENT_ERROR_CODES.WORKSPACE_ID_REQUIRED,
		"El ID del workspace es requerido.",
		400,
	),
	CLIENT_LOCATION_REQUIRED: new ErrorDetails(
		CLIENT_ERROR_CODES.LOCATION_REQUIRED,
		"La ubicación del cliente es requerida.",
		400,
	),
	CLIENT_ALREADY_EXISTS: new ErrorDetails(
		CLIENT_ERROR_CODES.ALREADY_EXISTS,
		"Ya existe un cliente con el mismo email o teléfono en este workspace.",
		409,
	),
	CLIENT_NOT_FOUND: new ErrorDetails(
		CLIENT_ERROR_CODES.NOT_FOUND,
		"El cliente especificado no fue encontrado en este workspace.",
		404,
	),
} as const;
