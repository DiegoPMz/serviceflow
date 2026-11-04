import { Type } from "@sinclair/typebox";
import { phoneNumberSchema } from "../shared/phone";

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
