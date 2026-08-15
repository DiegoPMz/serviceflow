import { type Static, Type } from "@sinclair/typebox";
import { orderStatusSchema } from "./order.primitives";

export const changeOrderStatusBodySchema = Type.Object({
	status: orderStatusSchema,
});

export type ChangeOrderStatusRequest = Static<
	typeof changeOrderStatusBodySchema
>;
