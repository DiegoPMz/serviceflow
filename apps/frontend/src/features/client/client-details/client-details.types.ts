import type { Treaty } from "@elysia/eden/treaty2";
import type { Eden } from "@/shared/http/client";

type WorkspaceClientsApi = ReturnType<Eden["v1"]["workspaces"]>["clients"];

/** Cliente individual consultado por id dentro de un workspace. */
export type ClientDetails = Treaty.Data<ReturnType<WorkspaceClientsApi>["get"]>;
