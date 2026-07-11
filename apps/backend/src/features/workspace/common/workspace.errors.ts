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
} as const;
