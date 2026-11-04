import type { Treaty } from "@elysia/eden/treaty2";
import type { Eden } from "@/shared/http/client";

type DeviceApi = ReturnType<ReturnType<Eden["v1"]["workspaces"]>["devices"]>;

export type PaginatedDeviceComponents = Treaty.Data<
	DeviceApi["components"]["get"]
>;

/** Elemento del catálogo de componentes de un dispositivo. */
export type DeviceComponentListItem =
	PaginatedDeviceComponents["items"][number];

export type DeviceComponentType = DeviceComponentListItem["type"];
