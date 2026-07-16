import { ErrorDetails } from "@serviceflow/backend/shared/result";

export const DeviceErrors = {
	DEVICE_WORKSPACE_ID_REQUIRED: new ErrorDetails(
		"DEVICE_WORKSPACE_ID_REQUIRED",
		"El ID del workspace es requerido.",
	),
	DEVICE_CLIENT_ID_REQUIRED: new ErrorDetails(
		"DEVICE_CLIENT_ID_REQUIRED",
		"El ID del cliente es requerido.",
	),
	DEVICE_SERIAL_NUMBER_REQUIRED: new ErrorDetails(
		"DEVICE_SERIAL_NUMBER_REQUIRED",
		"El número de serie del dispositivo es requerido.",
	),
	DEVICE_SERIAL_NUMBER_TOO_LONG: new ErrorDetails(
		"DEVICE_SERIAL_NUMBER_TOO_LONG",
		"El número de serie no puede exceder 200 caracteres.",
	),
	DEVICE_BRAND_REQUIRED: new ErrorDetails(
		"DEVICE_BRAND_REQUIRED",
		"La marca del dispositivo es requerida.",
	),
	DEVICE_BRAND_TOO_LONG: new ErrorDetails(
		"DEVICE_BRAND_TOO_LONG",
		"La marca no puede exceder 50 caracteres.",
	),
	DEVICE_MODEL_REQUIRED: new ErrorDetails(
		"DEVICE_MODEL_REQUIRED",
		"El modelo del dispositivo es requerido.",
	),
	DEVICE_MODEL_TOO_LONG: new ErrorDetails(
		"DEVICE_MODEL_TOO_LONG",
		"El modelo no puede exceder 100 caracteres.",
	),
	DEVICE_COMPONENT_NAME_REQUIRED: new ErrorDetails(
		"DEVICE_COMPONENT_NAME_REQUIRED",
		"El nombre del componente es requerido.",
	),
	DEVICE_COMPONENT_NAME_TOO_LONG: new ErrorDetails(
		"DEVICE_COMPONENT_NAME_TOO_LONG",
		"El nombre del componente no puede exceder 150 caracteres.",
	),
	DEVICE_COMPONENT_PART_NUMBER_REQUIRED: new ErrorDetails(
		"DEVICE_COMPONENT_PART_NUMBER_REQUIRED",
		"El número de parte del componente es requerido.",
	),
	DEVICE_COMPONENT_PART_NUMBER_TOO_LONG: new ErrorDetails(
		"DEVICE_COMPONENT_PART_NUMBER_TOO_LONG",
		"El número de parte no puede exceder 100 caracteres.",
	),
	DEVICE_COMPONENT_TYPE_REQUIRED: new ErrorDetails(
		"DEVICE_COMPONENT_TYPE_REQUIRED",
		"El tipo del componente es requerido.",
	),
	DEVICE_ALREADY_EXISTS: new ErrorDetails(
		"DEVICE_ALREADY_EXISTS",
		"Ya existe un dispositivo con el mismo número de serie en este workspace.",
	),
} as const;
