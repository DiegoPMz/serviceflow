import type { Transactional } from "@serviceflow/backend/shared/database";
import type { WorkspaceActivityRepository } from "../../activity/common/activity-repository";
import type { ClientRepository } from "./client-repository";

export interface ClientsRepositories {
	clients: ClientRepository;
	activities: WorkspaceActivityRepository;
}

export interface ClientsUnitOfWork extends Transactional<ClientsRepositories> {}
