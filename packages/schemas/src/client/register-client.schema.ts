import { type Static, Type } from "@sinclair/typebox";
import {
	clientEmailSchema,
	clientLocationSchema,
	clientNameSchema,
	clientPhoneNumberSchema,
} from "./client.primitives";

export const registerClientBodySchema = Type.Object({
	name: clientNameSchema,
	email: clientEmailSchema,
	phoneNumber: clientPhoneNumberSchema,
	location: clientLocationSchema,
});

export type RegisterClientRequest = Static<typeof registerClientBodySchema>;
