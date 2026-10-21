import type { Treaty } from "@elysia/eden/treaty2";
import type { Eden } from "@/shared/http/client";

export type RecentActivities = Treaty.Data<
	ReturnType<Eden["v1"]["workspaces"]>["activities"]["get"]
>;

export type RecentActivity = RecentActivities[number];
