import { ErrorDetails } from "@serviceflow/backend/shared/result";
import { ACTIVITY_ERROR_CODES } from "@serviceflow/error-codes";

export const ActivityErrors = {
	ACTIVITY_WORKSPACE_ID_REQUIRED: new ErrorDetails(
		ACTIVITY_ERROR_CODES.WORKSPACE_ID_REQUIRED,
		"El ID del workspace es requerido para registrar la actividad.",
		400,
	),
	ACTIVITY_ACTOR_ID_REQUIRED: new ErrorDetails(
		ACTIVITY_ERROR_CODES.ACTOR_ID_REQUIRED,
		"El ID del usuario que realizó la acción es requerido.",
		400,
	),
	ACTIVITY_ACTOR_NAME_REQUIRED: new ErrorDetails(
		ACTIVITY_ERROR_CODES.ACTOR_NAME_REQUIRED,
		"El nombre del usuario que realizó la acción es requerido.",
		400,
	),
	ACTIVITY_ACTOR_NAME_TOO_LONG: new ErrorDetails(
		ACTIVITY_ERROR_CODES.ACTOR_NAME_TOO_LONG,
		"El nombre del usuario no puede exceder 200 caracteres.",
		400,
	),
	ACTIVITY_TYPE_INVALID: new ErrorDetails(
		ACTIVITY_ERROR_CODES.TYPE_INVALID,
		"El tipo de actividad proporcionado no es válido.",
		400,
	),
	ACTIVITY_ENTITY_LABEL_REQUIRED: new ErrorDetails(
		ACTIVITY_ERROR_CODES.ENTITY_LABEL_REQUIRED,
		"La información descriptiva de la entidad afectada es requerida.",
		400,
	),
	ACTIVITY_ENTITY_LABEL_TOO_LONG: new ErrorDetails(
		ACTIVITY_ERROR_CODES.ENTITY_LABEL_TOO_LONG,
		"La información descriptiva de la entidad no puede exceder 255 caracteres.",
		400,
	),
	ACTIVITY_STATUS_UNCHANGED: new ErrorDetails(
		ACTIVITY_ERROR_CODES.STATUS_UNCHANGED,
		"El cambio de estatus debe registrar un estatus diferente al anterior.",
		400,
	),
	ACTIVITY_CONSUMABLE_COUNT_INVALID: new ErrorDetails(
		ACTIVITY_ERROR_CODES.CONSUMABLE_COUNT_INVALID,
		"La cantidad de consumibles registrados debe ser un entero mayor a cero.",
		400,
	),
	ACTIVITY_LIMIT_OUT_OF_RANGE: new ErrorDetails(
		ACTIVITY_ERROR_CODES.LIMIT_OUT_OF_RANGE,
		"El límite de actividades debe estar entre 1 y 50.",
		400,
	),
} as const;
