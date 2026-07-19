import { ErrorDetails } from "../result";

export const PaginationErrors = {
	PAGINATION_CURSOR_INVALID: new ErrorDetails(
		"PAGINATION_CURSOR_INVALID",
		"El cursor de paginación no es válido o no es compatible con los parámetros actuales.",
	),
} as const;
