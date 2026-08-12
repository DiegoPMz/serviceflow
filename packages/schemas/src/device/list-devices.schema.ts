import { type Static, Type } from "@sinclair/typebox";
import { paginationRequestSchema } from "../shared/pagination.schema";
import { deviceClientIdSchema } from "./device.primitives";

export const listDevicesQuerySchema = Type.Composite([
	paginationRequestSchema({
		orderBy: ["id", "brand", "model", "serialNumber", "clientId"] as const,
		defaultLimit: 20,
	}),
	Type.Object({
		clientId: Type.Optional(deviceClientIdSchema),
	}),
]);

export type ListDevicesQuery = Static<typeof listDevicesQuerySchema>;
