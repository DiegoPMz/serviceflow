import { type Static, Type } from "@sinclair/typebox";
import {
	orderClientIdSchema,
	orderComponentItemSchema,
	orderDeviceIdSchema,
	orderObservationsSchema,
} from "./order.primitives";

export const createOrderBodySchema = Type.Object({
	clientId: orderClientIdSchema,
	deviceId: orderDeviceIdSchema,
	observations: orderObservationsSchema,
	components: Type.Array(orderComponentItemSchema),
});

export type CreateOrderRequest = Static<typeof createOrderBodySchema>;
