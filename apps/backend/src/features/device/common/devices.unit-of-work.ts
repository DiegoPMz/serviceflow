import type { Transactional } from "@serviceflow/backend/shared/database";
import type { WorkspaceActivityRepository } from "../../activity/common/activity-repository";
import type { DeviceRepository } from "./device-repository";

export interface DevicesRepositories {
	devices: DeviceRepository;
	activities: WorkspaceActivityRepository;
}

export interface DevicesUnitOfWork extends Transactional<DevicesRepositories> {}
