import { Type } from "@sinclair/typebox";

// Client
export const clientNameSchema = Type.String({ minLength: 1, maxLength: 150 });
export const clientEmailSchema = Type.String({
	format: "email",
	maxLength: 200,
});
export const clientPhoneNumberSchema = Type.String({
	pattern: "^\\+[1-9]\\d{1,14}$",
	minLength: 2,
	maxLength: 20,
});
export const clientLocationSchema = Type.String({
	minLength: 1,
	maxLength: 255,
});
