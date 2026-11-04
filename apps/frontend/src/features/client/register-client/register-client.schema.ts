import * as v from "valibot";
import { EmailSchema, PhoneSchema } from "@/shared/schemas";

export const ClientNameSchema = v.pipe(
	v.string("Nombre inválido."),
	v.trim(),
	v.nonEmpty("Campo obligatorio."),
	v.maxLength(150, "Máximo 150 caracteres."),
);

export const ClientEmailSchema = v.pipe(
	EmailSchema,
	v.maxLength(200, "Máximo 200 caracteres."),
);

export const ClientLocationSchema = v.pipe(
	v.string("Dirección inválida."),
	v.trim(),
	v.nonEmpty("Campo obligatorio."),
	v.maxLength(255, "Máximo 255 caracteres."),
);

export const RegisterClientSchema = v.object({
	name: ClientNameSchema,
	email: ClientEmailSchema,
	phoneNumber: PhoneSchema,
	location: ClientLocationSchema,
});

export type RegisterClientInput = v.InferInput<typeof RegisterClientSchema>;
