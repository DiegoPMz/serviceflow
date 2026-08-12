import { type Static, Type } from "@sinclair/typebox";
import { dataUriImageSchema } from "./order.primitives";

export const generateOrderDocumentBodySchema = Type.Object({
	deviceImageBase64: dataUriImageSchema,
	clientSignatureBase64: dataUriImageSchema,
});

export type GenerateOrderDocumentRequest = Static<
	typeof generateOrderDocumentBodySchema
>;
