import { type Static, Type } from "@sinclair/typebox";
import {
	deviceBrandSchema,
	deviceClientIdSchema,
	deviceComponentSchema,
	deviceModelSchema,
	deviceSerialNumberSchema,
} from "./device.primitives";

export const registerDeviceBodySchema = Type.Object({
	clientId: deviceClientIdSchema,
	serialNumber: deviceSerialNumberSchema,
	brand: deviceBrandSchema,
	model: deviceModelSchema,
	components: Type.Array(deviceComponentSchema),
});

export type RegisterDeviceRequest = Static<typeof registerDeviceBodySchema>;
