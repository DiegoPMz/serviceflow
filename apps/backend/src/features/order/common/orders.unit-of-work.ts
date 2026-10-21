import type { Transactional } from "@serviceflow/backend/shared/database";
import type { WorkspaceActivityRepository } from "../../activity/common/activity-repository";
import type { WorkspaceRepository } from "../../workspace/common/workspace-repository";
import type { OrderRepository } from "./order-repository";

export interface OrdersRepositories {
	orders: OrderRepository;
	workspaces: WorkspaceRepository;
	activities: WorkspaceActivityRepository;
}

export interface OrdersUnitOfWork extends Transactional<OrdersRepositories> {}
