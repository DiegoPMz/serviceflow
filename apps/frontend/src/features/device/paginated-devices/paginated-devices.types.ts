import type { Treaty } from "@elysia/eden/treaty2";
import type { Eden } from "@/shared/http/client";

type WorkspacesApi = ReturnType<Eden["v1"]["workspaces"]>;

export type PaginatedDevices = Treaty.Data<WorkspacesApi["devices"]["get"]>;

/** Elemento del listado paginado: forma ligera usada en selectores y resúmenes. */
export type DeviceListItem = PaginatedDevices["items"][number];
