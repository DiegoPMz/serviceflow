import type { Treaty } from "@elysia/eden/treaty2";
import type { Eden } from "@/shared/http/client";

type WorkspaceOrdersApi = ReturnType<Eden["v1"]["workspaces"]>["orders"];

export type OrderDetails = Treaty.Data<ReturnType<WorkspaceOrdersApi>["get"]>;

export type OrderDetailStatus = OrderDetails["status"];

export type FinalOrderStatus = Exclude<OrderDetailStatus, "pendiente">;

export type OrderServiceType = OrderDetails["serviceType"];

export type OrderSupply = OrderDetails["supplies"][number];
