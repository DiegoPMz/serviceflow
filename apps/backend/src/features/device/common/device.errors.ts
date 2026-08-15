import { ErrorDetails } from "@serviceflow/backend/shared/result";
export const DeviceErrors = {
	DEVICE_WORKSPACE_ID_REQUIRED: new ErrorDetails(
		"DEVICE_WORKSPACE_ID_REQUIRED",
		"El ID del workspace es requerido.",
		400,
	),
	DEVICE_CLIENT_ID_REQUIRED: new ErrorDetails(
		"DEVICE_CLIENT_ID_REQUIRED",
		"El ID del cliente es requerido.",
		400,
	),
	DEVICE_SERIAL_NUMBER_REQUIRED: new ErrorDetails(
		"DEVICE_SERIAL_NUMBER_REQUIRED",
		"El número de serie del dispositivo es requerido.",
		400,
	),
	DEVICE_SERIAL_NUMBER_TOO_LONG: new ErrorDetails(
		"DEVICE_SERIAL_NUMBER_TOO_LONG",
		"El número de serie no puede exceder 200 caracteres.",
		400,
	),
	DEVICE_BRAND_REQUIRED: new ErrorDetails(
		"DEVICE_BRAND_REQUIRED",
		"La marca del dispositivo es requerida.",
		400,
	),
	DEVICE_BRAND_TOO_LONG: new ErrorDetails(
		"DEVICE_BRAND_TOO_LONG",
		"La marca no puede exceder 50 caracteres.",
		400,
	),
	DEVICE_MODEL_REQUIRED: new ErrorDetails(
		"DEVICE_MODEL_REQUIRED",
		"El modelo del dispositivo es requerido.",
		400,
	),
	DEVICE_MODEL_TOO_LONG: new ErrorDetails(
		"DEVICE_MODEL_TOO_LONG",
		"El modelo no puede exceder 100 caracteres.",
		400,
	),
	DEVICE_COMPONENT_NAME_REQUIRED: new ErrorDetails(
		"DEVICE_COMPONENT_NAME_REQUIRED",
		"El nombre del componente es requerido.",
		400,
	),
	DEVICE_COMPONENT_NAME_TOO_LONG: new ErrorDetails(
		"DEVICE_COMPONENT_NAME_TOO_LONG",
		"El nombre del componente no puede exceder 150 caracteres.",
		400,
	),
	DEVICE_COMPONENT_PART_NUMBER_REQUIRED: new ErrorDetails(
		"DEVICE_COMPONENT_PART_NUMBER_REQUIRED",
		"El número de parte del componente es requerido.",
		400,
	),
	DEVICE_COMPONENT_PART_NUMBER_TOO_LONG: new ErrorDetails(
		"DEVICE_COMPONENT_PART_NUMBER_TOO_LONG",
		"El número de parte no puede exceder 100 caracteres.",
		400,
	),
	DEVICE_COMPONENT_TYPE_REQUIRED: new ErrorDetails(
		"DEVICE_COMPONENT_TYPE_REQUIRED",
		"El tipo del componente es requerido.",
		400,
	),
	DEVICE_ALREADY_EXISTS: new ErrorDetails(
		"DEVICE_ALREADY_EXISTS",
		"Ya existe un dispositivo con el mismo número de serie en este workspace.",
		409,
	),
	DEVICE_COMPONENT_NOT_FOUND: (componentId: string) =>
		new ErrorDetails(
			"DEVICE_COMPONENT_NOT_FOUND",
			"El componente especificado no pertenece al dispositivo registrado.",
			404,
			{
				componentId,
			},
		),
	DEVICE_NOT_FOUND: new ErrorDetails(
		"DEVICE_NOT_FOUND",
		"El dispositivo especificado no fue encontrado en este workspace.",
		404,
	),
} as const;
