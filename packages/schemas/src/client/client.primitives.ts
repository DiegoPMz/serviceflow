import { Type } from "@sinclair/typebox";
import { phoneNumberSchema } from "../shared/phone";

// IDs
export const clientIdSchema = Type.String({ minLength: 26, maxLength: 26 });

// Client
export const clientNameSchema = Type.String({ minLength: 1, maxLength: 150 });
export const clientEmailSchema = Type.String({
	format: "email",
	maxLength: 200,
});
export const clientPhoneNumberSchema = phoneNumberSchema;
export const clientLocationSchema = Type.String({
	minLength: 1,
	maxLength: 255,
});
