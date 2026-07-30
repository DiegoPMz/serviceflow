import { ErrorDetails } from "../result";

export const AuthErrors = {
	MISSING_HEADER: new ErrorDetails(
		"AUTH_MISSING_HEADER",
		"Falta la cabecera de autorización o el formato es incorrecto.",
		401,
	),
	INVALID_TOKEN: new ErrorDetails(
		"AUTH_INVALID_TOKEN",
		"El token proporcionado es inválido, ha expirado o fue alterado.",
		401,
	),
	SERVICE_UNAVAILABLE: new ErrorDetails(
		"AUTH_SERVICE_UNAVAILABLE",
		"No se pudo verificar la autenticación debido a un fallo en la infraestructura.",
		500,
	),
	INCOMPLETE_USER_PROFILE: new ErrorDetails(
		"AUTH_INCOMPLETE_USER_PROFILE",
		"El perfil de usuario devuelto por el proveedor de identidad no contiene el nombre o email requeridos.",
		502,
	),
} as const;
