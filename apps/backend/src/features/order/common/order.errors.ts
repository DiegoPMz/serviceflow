import { ErrorDetails } from "@serviceflow/backend/shared/result";

export const OrderErrors = {
	// --- Entity: Order ---
	ORDER_CLIENT_ID_REQUIRED: new ErrorDetails(
		"ORDER_CLIENT_ID_REQUIRED",
		"El ID del cliente es requerido.",
	),
	ORDER_DEVICE_MODEL_REQUIRED: new ErrorDetails(
		"ORDER_DEVICE_MODEL_REQUIRED",
		"El modelo del dispositivo es requerido.",
	),
	ORDER_DEVICE_BRAND_REQUIRED: new ErrorDetails(
		"ORDER_DEVICE_BRAND_REQUIRED",
		"La marca del dispositivo es requerida.",
	),
	ORDER_DEVICE_SERIAL_REQUIRED: new ErrorDetails(
		"ORDER_DEVICE_SERIAL_REQUIRED",
		"El número de serie del dispositivo es requerido.",
	),
	ORDER_ISSUE_OBSERVATION_REQUIRED: new ErrorDetails(
		"ORDER_ISSUE_OBSERVATION_REQUIRED",
		"La observación del problema es requerida.",
	),
	ORDER_ISSUE_OBSERVATION_TOO_LONG: new ErrorDetails(
		"ORDER_ISSUE_OBSERVATION_TOO_LONG",
		"La observación del problema no puede exceder 1000 caracteres.",
	),
	ORDER_WORKSPACE_ID_REQUIRED: new ErrorDetails(
		"ORDER_WORKSPACE_ID_REQUIRED",
		"El ID del workspace es requerido.",
	),
	ORDER_USER_ID_REQUIRED: new ErrorDetails(
		"ORDER_USER_ID_REQUIRED",
		"El ID del usuario es requerido.",
	),
	ORDER_FOLIO_INVALID: new ErrorDetails(
		"ORDER_FOLIO_INVALID",
		"El folio proporcionado es inválido.",
	),

	// --- Entity: Folio ---
	FOLIO_WORKSPACE_ORDER_COUNT_NAN: new ErrorDetails(
		"FOLIO_WORKSPACE_ORDER_COUNT_NAN",
		"El contador de órdenes del workspace no es un número válido.",
	),
	FOLIO_WORKSPACE_ORDER_COUNT_NEGATIVE: new ErrorDetails(
		"FOLIO_WORKSPACE_ORDER_COUNT_NEGATIVE",
		"El contador de órdenes del workspace no puede ser negativo.",
	),
	FOLIO_WORKSPACE_PREFIX_REQUIRED: new ErrorDetails(
		"FOLIO_WORKSPACE_PREFIX_REQUIRED",
		"El prefijo del workspace es requerido para generar el folio.",
	),

	// --- Entity: OrderComponent ---
	ORDER_COMPONENT_DEVICE_COMPONENT_ID_REQUIRED: new ErrorDetails(
		"ORDER_COMPONENT_DEVICE_COMPONENT_ID_REQUIRED",
		"El ID del componente del dispositivo es requerido.",
	),
	ORDER_COMPONENT_NAME_REQUIRED: new ErrorDetails(
		"ORDER_COMPONENT_NAME_REQUIRED",
		"El nombre del componente es requerido.",
	),
	ORDER_COMPONENT_QUANTITY_INVALID: new ErrorDetails(
		"ORDER_COMPONENT_QUANTITY_INVALID",
		"La cantidad del componente debe ser un entero mayor a cero.",
	),

	//--- Entity: User ---
	ORDER_USER_NAME_SNAPSHOT_REQUIRED: new ErrorDetails(
		"ORDER_USER_NAME_SNAPSHOT_REQUIRED",
		"El nombre del usuario al momento de crear la orden es requerido.",
	),

	ORDER_NOT_FOUND: new ErrorDetails(
		"ORDER_NOT_FOUND",
		"La orden especificada no fue encontrada.",
	),
	ORDER_DOCUMENT_ALREADY_EXISTS: new ErrorDetails(
		"ORDER_DOCUMENT_ALREADY_EXISTS",
		"El documento de la orden ya existe.",
	),
	ORDER_DOCUMENT_NOT_GENERATED: new ErrorDetails(
		"ORDER_DOCUMENT_NOT_GENERATED",
		"El documento de la orden aún no ha sido generado.",
	),
} as const;
