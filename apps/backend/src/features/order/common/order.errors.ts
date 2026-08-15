import { ErrorDetails } from "@serviceflow/backend/shared/result";
export const OrderErrors = {
	// --- Entity: Order ---
	ORDER_CLIENT_ID_REQUIRED: new ErrorDetails(
		"ORDER_CLIENT_ID_REQUIRED",
		"El ID del cliente es requerido.",
		400,
	),
	ORDER_DEVICE_MODEL_REQUIRED: new ErrorDetails(
		"ORDER_DEVICE_MODEL_REQUIRED",
		"El modelo del dispositivo es requerido.",
		400,
	),
	ORDER_DEVICE_BRAND_REQUIRED: new ErrorDetails(
		"ORDER_DEVICE_BRAND_REQUIRED",
		"La marca del dispositivo es requerida.",
		400,
	),
	ORDER_DEVICE_SERIAL_REQUIRED: new ErrorDetails(
		"ORDER_DEVICE_SERIAL_REQUIRED",
		"El número de serie del dispositivo es requerido.",
		400,
	),
	ORDER_ISSUE_OBSERVATION_REQUIRED: new ErrorDetails(
		"ORDER_ISSUE_OBSERVATION_REQUIRED",
		"La observación del problema es requerida.",
		400,
	),
	ORDER_ISSUE_OBSERVATION_TOO_LONG: new ErrorDetails(
		"ORDER_ISSUE_OBSERVATION_TOO_LONG",
		"La observación del problema no puede exceder 1000 caracteres.",
		400,
	),
	ORDER_WORKSPACE_ID_REQUIRED: new ErrorDetails(
		"ORDER_WORKSPACE_ID_REQUIRED",
		"El ID del workspace es requerido.",
		400,
	),
	ORDER_USER_ID_REQUIRED: new ErrorDetails(
		"ORDER_USER_ID_REQUIRED",
		"El ID del usuario es requerido.",
		400,
	),
	ORDER_FOLIO_INVALID: new ErrorDetails(
		"ORDER_FOLIO_INVALID",
		"El folio proporcionado es inválido.",
		400,
	),

	// --- Entity: Folio ---
	FOLIO_WORKSPACE_ORDER_COUNT_NAN: new ErrorDetails(
		"FOLIO_WORKSPACE_ORDER_COUNT_NAN",
		"El contador de órdenes del workspace no es un número válido.",
		400,
	),
	FOLIO_WORKSPACE_ORDER_COUNT_NEGATIVE: new ErrorDetails(
		"FOLIO_WORKSPACE_ORDER_COUNT_NEGATIVE",
		"El contador de órdenes del workspace no puede ser negativo.",
		400,
	),
	FOLIO_WORKSPACE_PREFIX_REQUIRED: new ErrorDetails(
		"FOLIO_WORKSPACE_PREFIX_REQUIRED",
		"El prefijo del workspace es requerido para generar el folio.",
		400,
	),

	// --- Entity: OrderComponent ---
	ORDER_COMPONENT_DEVICE_COMPONENT_ID_REQUIRED: new ErrorDetails(
		"ORDER_COMPONENT_DEVICE_COMPONENT_ID_REQUIRED",
		"El ID del componente del dispositivo es requerido.",
		400,
	),
	ORDER_COMPONENT_NAME_REQUIRED: new ErrorDetails(
		"ORDER_COMPONENT_NAME_REQUIRED",
		"El nombre del componente es requerido.",
		400,
	),
	ORDER_COMPONENT_QUANTITY_INVALID: new ErrorDetails(
		"ORDER_COMPONENT_QUANTITY_INVALID",
		"La cantidad del componente debe ser un entero mayor a cero.",
		400,
	),

	//--- Entity: User ---
	ORDER_USER_NAME_SNAPSHOT_REQUIRED: new ErrorDetails(
		"ORDER_USER_NAME_SNAPSHOT_REQUIRED",
		"El nombre del usuario al momento de crear la orden es requerido.",
		400,
	),

	ORDER_NOT_FOUND: new ErrorDetails(
		"ORDER_NOT_FOUND",
		"La orden especificada no fue encontrada.",
		404,
	),
	ORDER_DOCUMENT_ALREADY_EXISTS: new ErrorDetails(
		"ORDER_DOCUMENT_ALREADY_EXISTS",
		"El documento de la orden ya existe.",
		409,
	),
	ORDER_DOCUMENT_NOT_GENERATED: new ErrorDetails(
		"ORDER_DOCUMENT_NOT_GENERATED",
		"El documento de la orden aún no ha sido generado.",
		404,
	),

	// --- Entity: OrderStatus ---
	ORDER_ALREADY_DELIVERED: new ErrorDetails(
		"ORDER_ALREADY_DELIVERED",
		"La orden ya fue entregada.",
		400,
	),
	ORDER_ALREADY_CANCELED: new ErrorDetails(
		"ORDER_ALREADY_CANCELED",
		"La orden ya fue cancelada.",
		400,
	),
	ORDER_CANNOT_DELIVER_CANCELED: new ErrorDetails(
		"ORDER_CANNOT_DELIVER_CANCELED",
		"No se puede entregar una orden cancelada.",
		422,
	),
	ORDER_CANNOT_CANCEL_DELIVERED: new ErrorDetails(
		"ORDER_CANNOT_CANCEL_DELIVERED",
		"No se puede cancelar una orden entregada.",
		422,
	),
} as const;
