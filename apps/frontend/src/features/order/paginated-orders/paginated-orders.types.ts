import type { Treaty } from "@elysia/eden/treaty2";
import type { Eden } from "@/shared/http/client";

export type PaginatedOrders = Treaty.Data<
	ReturnType<Eden["v1"]["workspaces"]>["orders"]["get"]
>;

export type OrderSummary = Treaty.Data<
	ReturnType<Eden["v1"]["workspaces"]>["orders"]["get"]
>["items"][0];
