import * as v from "valibot";

export const OrderClientIdSchema = v.pipe(
	v.string("Cliente inválido."),
	v.trim(),
	v.length(26, "Selecciona un cliente válido."),
);

export const OrderDeviceIdSchema = v.pipe(
	v.string("Dispositivo inválido."),
	v.trim(),
	v.length(26, "Selecciona un dispositivo válido."),
);

export const OrderComponentIdSchema = v.pipe(
	v.string("Componente inválido."),
	v.trim(),
	v.length(26, "Selecciona un componente válido."),
);

export const OrderQuantitySchema = v.pipe(
	v.number("Cantidad inválida."),
	v.integer("Debe ser un número entero."),
	v.minValue(1, "Mínimo 1."),
);

export const OrderObservationsSchema = v.pipe(
	v.string("Descripción inválida."),
	v.trim(),
	v.nonEmpty("Campo obligatorio."),
	v.maxLength(1000, "Máximo 1000 caracteres."),
);

export const OrderServiceTypeSchema = v.picklist(
	[
		"preventive_maintenance",
		"corrective_maintenance",
		"diagnostics",
		"installation",
		"other",
	],
	"Selecciona un tipo de servicio válido.",
);

export type OrderServiceType = v.InferOutput<typeof OrderServiceTypeSchema>;

export const MAX_ORDER_PHOTO_SIZE = 1 * 1024 * 1024;

export const ORDER_PHOTO_MIME_TYPES = [
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif",
] as const;

export const OrderPhotoFileSchema = v.pipe(
	v.instance(File, "Agrega una fotografía del equipo."),
	v.check(
		(file) => (ORDER_PHOTO_MIME_TYPES as readonly string[]).includes(file.type),
		"Selecciona una imagen JPG, PNG, WEBP o GIF.",
	),
	v.check(
		(file) => file.size <= MAX_ORDER_PHOTO_SIZE,
		"La imagen no puede superar 1 MB.",
	),
);

export const OrderSignatureDataUrlSchema = v.pipe(
	v.string("Captura la firma del cliente."),
	v.startsWith("data:image/", "Captura la firma del cliente."),
);

export const OrderComponentSchema = v.object({
	id: OrderComponentIdSchema,
	quantity: OrderQuantitySchema,
});

export const CreateOrderSchema = v.object({
	clientId: OrderClientIdSchema,
	deviceId: OrderDeviceIdSchema,
	serviceType: OrderServiceTypeSchema,
	observations: OrderObservationsSchema,
	components: v.array(OrderComponentSchema, "Componentes inválidos."),
});

export const CreateOrderFormSchema = v.pipe(
	v.object({
		...CreateOrderSchema.entries,
		photoFile: v.nullable(OrderPhotoFileSchema),
		signatureDataUrl: v.nullable(OrderSignatureDataUrlSchema),
	}),
	v.check(
		(value) => value.photoFile !== null,
		"Agrega una fotografía del equipo.",
	),
	v.check(
		(value) => value.signatureDataUrl !== null,
		"Captura la firma del cliente.",
	),
);

export type OrderComponentInput = v.InferInput<typeof OrderComponentSchema>;

export type CreateOrderInput = v.InferInput<typeof CreateOrderSchema>;

export type CreateOrderFormValues = v.InferInput<typeof CreateOrderFormSchema>;
