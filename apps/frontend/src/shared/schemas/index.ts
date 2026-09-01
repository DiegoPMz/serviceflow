import * as v from "valibot";

const phoneRegex = /^\+[1-9]\d{7,14}$/;
export const PhoneSchema = v.pipe(
	v.string(),
	v.trim(),
	v.nonEmpty("El teléfono es obligatorio"),
	v.check(
		(value) => phoneRegex.test(value),
		"Ingresa un número de teléfono válido en formato internacional.",
	),
);

export const EmailSchema = v.pipe(
	v.string("Ingresa tu correo electrónico."),
	v.trim(),
	v.email("Ingresa un correo electrónico válido. Ejemplo: usuario@ejemplo.com"),
);
