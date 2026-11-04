import { Type } from "@sinclair/typebox";

/**
 * Regla única de teléfono para todo el proyecto.
 *
 * Acepta:
 * - 10 dígitos locales sin `+` (ej. 5512345678)
 * - Formato internacional con `+` (ej. +5215551234567)
 */
export const PHONE_PATTERN = "^(?:\\+[1-9]\\d{9,14}|[1-9]\\d{9})$";

export const PHONE_REGEX = new RegExp(PHONE_PATTERN);

export const phoneNumberSchema = Type.String({
	pattern: PHONE_PATTERN,
	minLength: 10,
	maxLength: 16,
});
