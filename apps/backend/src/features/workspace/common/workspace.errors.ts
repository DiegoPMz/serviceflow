import { ErrorDetails } from "@serviceflow/backend/shared/result";

export const workspaceErrors = {
	WORKSPACE_NAME_REQUIRED: new ErrorDetails(
		"WORKSPACE_NAME_REQUIRED",
		"El nombre del workspace es requerido.",
	),
	WORKSPACE_NAME_TOO_LONG: new ErrorDetails(
		"WORKSPACE_NAME_TOO_LONG",
		"El nombre del workspace no puede exceder 250 caracteres.",
	),
	WORKSPACE_INVALID_CURSOR: new ErrorDetails(
		"WORKSPACE_INVALID_CURSOR",
		"El cursor proporcionado es inválido o ha expirado.",
	),
	WORKSPACE_LIMIT_EXCEEDED: new ErrorDetails(
		"WORKSPACE_LIMIT_EXCEEDED",
		"El límite debe estar entre 1 y 100.",
	),
	WORKSPACE_PREFIX_REQUIRED: new ErrorDetails(
		"WORKSPACE_PREFIX_REQUIRED",
		"El prefijo del workspace es requerido.",
	),
	WORKSPACE_PREFIX_TOO_SHORT: new ErrorDetails(
		"WORKSPACE_PREFIX_TOO_SHORT",
		"El prefijo debe tener al menos 4 caracteres.",
	),
	WORKSPACE_PREFIX_TOO_LONG: new ErrorDetails(
		"WORKSPACE_PREFIX_TOO_LONG",
		"El prefijo no puede exceder 6 caracteres.",
	),
	WORKSPACE_PREFIX_INVALID_FORMAT: new ErrorDetails(
		"WORKSPACE_PREFIX_INVALID_FORMAT",
		"El prefijo debe contener solo letras mayúsculas (A-Z).",
	),
	WORKSPACE_OWNER_REQUIRED: new ErrorDetails(
		"WORKSPACE_OWNER_REQUIRED",
		"El propietario del workspace es requerido.",
	),
	WORKSPACE_NOT_FOUND: new ErrorDetails(
		"WORKSPACE_NOT_FOUND",
		"El workspace especificado no fue encontrado.",
	),
	WORKSPACE_COMPANY_NAME_REQUIRED: new ErrorDetails(
		"WORKSPACE_COMPANY_NAME_REQUIRED",
		"El nombre de la empresa es requerido.",
	),
	WORKSPACE_COMPANY_NAME_TOO_LONG: new ErrorDetails(
		"WORKSPACE_COMPANY_NAME_TOO_LONG",
		"El nombre de la empresa no puede exceder 250 caracteres.",
	),
	WORKSPACE_COMPANY_PHONE_REQUIRED: new ErrorDetails(
		"WORKSPACE_COMPANY_PHONE_REQUIRED",
		"El teléfono de la empresa es requerido.",
	),
	WORKSPACE_COMPANY_PHONE_INVALID: new ErrorDetails(
		"WORKSPACE_COMPANY_PHONE_INVALID",
		"El formato del teléfono es inválido. Use formato internacional (ej: +1234567890).",
	),
	WORKSPACE_COMPANY_EMAIL_REQUIRED: new ErrorDetails(
		"WORKSPACE_COMPANY_EMAIL_REQUIRED",
		"El email de la empresa es requerido.",
	),
	WORKSPACE_COMPANY_EMAIL_INVALID: new ErrorDetails(
		"WORKSPACE_COMPANY_EMAIL_INVALID",
		"El formato del email es inválido.",
	),
	WORKSPACE_COMPANY_ADDRESS_REQUIRED: new ErrorDetails(
		"WORKSPACE_COMPANY_ADDRESS_REQUIRED",
		"La dirección de la empresa es requerida.",
	),
	WORKSPACE_COMPANY_ADDRESS_TOO_LONG: new ErrorDetails(
		"WORKSPACE_COMPANY_ADDRESS_TOO_LONG",
		"La dirección no puede exceder 255 caracteres.",
	),
	LOGO_FILE_NOT_FOUND: new ErrorDetails(
		"LOGO_FILE_NOT_FOUND",
		"El archivo del logo no se ha subido correctamente o no existe en el almacenamiento.",
	),
} as const;
