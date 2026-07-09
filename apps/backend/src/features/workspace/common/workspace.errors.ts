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
} as const;
