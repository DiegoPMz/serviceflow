import { Type } from "@sinclair/typebox";

// IDs
export const orderIdSchema = Type.String({ minLength: 26, maxLength: 26 });
export const orderClientIdSchema = Type.String({
	minLength: 26,
	maxLength: 26,
});
export const orderDeviceIdSchema = Type.String({
	minLength: 26,
	maxLength: 26,
});
export const orderComponentIdSchema = Type.String({
	minLength: 26,
	maxLength: 26,
});

// Order
export const orderObservationsSchema = Type.String({
	minLength: 1,
	maxLength: 1000,
});

export const orderQuantitySchema = Type.Integer({ minimum: 1 });

export const orderComponentItemSchema = Type.Object({
	id: orderComponentIdSchema,
	quantity: orderQuantitySchema,
});

// Documents
export const dataUriImageSchema = Type.String({
	pattern: "^data:image/(png|jpe?g|webp|gif);base64,",
	description: "Image encoded as a data URI (e.g. data:image/png;base64,....).",
});
