import { type Static, Type } from "@sinclair/typebox";
import {
	orderClientIdSchema,
	orderComponentItemSchema,
	orderDeviceIdSchema,
	orderObservationsSchema,
	orderServiceTypeSchema,
} from "./order.primitives";

export const createOrderBodySchema = Type.Object({
	clientId: orderClientIdSchema,
	deviceId: orderDeviceIdSchema,
	serviceType: orderServiceTypeSchema,
	observations: orderObservationsSchema,
	components: Type.Array(orderComponentItemSchema),
});

export type CreateOrderRequest = Static<typeof createOrderBodySchema>;
