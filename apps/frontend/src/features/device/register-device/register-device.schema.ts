import * as v from "valibot";

export const DeviceClientIdSchema = v.pipe(
	v.string("Cliente inválido."),
	v.trim(),
	v.length(26, "Selecciona un cliente válido."),
);

export const DeviceSerialNumberSchema = v.pipe(
	v.string("Número de serie inválido."),
	v.trim(),
	v.nonEmpty("Campo obligatorio."),
	v.maxLength(200, "Máximo 200 caracteres."),
);

export const DeviceBrandSchema = v.pipe(
	v.string("Marca inválida."),
	v.trim(),
	v.nonEmpty("Campo obligatorio."),
	v.maxLength(50, "Máximo 50 caracteres."),
);

export const DeviceModelSchema = v.pipe(
	v.string("Modelo inválido."),
	v.trim(),
	v.nonEmpty("Campo obligatorio."),
	v.maxLength(100, "Máximo 100 caracteres."),
);

export const ComponentNameSchema = v.pipe(
	v.string("Nombre inválido."),
	v.trim(),
	v.nonEmpty("Campo obligatorio."),
	v.maxLength(150, "Máximo 150 caracteres."),
);

export const ComponentPartNumberSchema = v.pipe(
	v.string("Número de parte inválido."),
	v.trim(),
	v.nonEmpty("Campo obligatorio."),
	v.maxLength(100, "Máximo 100 caracteres."),
);

export const ComponentTypeSchema = v.picklist(
	["supply", "replacement_part", "other"],
	"Tipo de componente inválido.",
);

export const DeviceComponentSchema = v.object({
	name: ComponentNameSchema,
	partNumber: ComponentPartNumberSchema,
	type: ComponentTypeSchema,
});

export const RegisterDeviceSchema = v.object({
	clientId: DeviceClientIdSchema,
	serialNumber: DeviceSerialNumberSchema,
	brand: DeviceBrandSchema,
	model: DeviceModelSchema,
	components: v.array(DeviceComponentSchema, "Componentes inválidos."),
});

export type DeviceComponentInput = v.InferInput<typeof DeviceComponentSchema>;

export type RegisterDeviceInput = v.InferInput<typeof RegisterDeviceSchema>;
