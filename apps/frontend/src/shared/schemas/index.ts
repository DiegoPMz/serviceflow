import * as v from "valibot";

export const PHONE_REGEX: RegExp = /^[1-9]\d{9}$/;
export const PhoneSchema = v.pipe(
	v.string("Teléfono inválido."),
	v.trim(),
	v.nonEmpty("Campo obligatorio."),
	v.check(
		(value) => PHONE_REGEX.test(value),
		"Ingresa un número de teléfono válido",
	),
);

export const EmailSchema = v.pipe(
	v.string("Campo obligatorio."),
	v.trim(),
	v.email("Correo electrónico inválido."),
);
