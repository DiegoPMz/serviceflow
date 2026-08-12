import { Type } from "@sinclair/typebox";

// IDs
export const deviceClientIdSchema = Type.String({
	minLength: 26,
	maxLength: 26,
});

// Device
export const deviceSerialNumberSchema = Type.String({
	minLength: 1,
	maxLength: 200,
});
export const deviceBrandSchema = Type.String({ minLength: 1, maxLength: 50 });
export const deviceModelSchema = Type.String({ minLength: 1, maxLength: 100 });

// Component
export const componentNameSchema = Type.String({
	minLength: 1,
	maxLength: 150,
});
export const componentPartNumberSchema = Type.String({
	minLength: 1,
	maxLength: 100,
});
export const componentTypeSchema = Type.Union([
	Type.Literal("supply"),
	Type.Literal("replacement_part"),
	Type.Literal("other"),
]);

export const deviceComponentSchema = Type.Object({
	name: componentNameSchema,
	partNumber: componentPartNumberSchema,
	type: componentTypeSchema,
});
