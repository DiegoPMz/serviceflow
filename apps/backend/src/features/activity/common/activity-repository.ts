import type { WorkspaceActivity } from "./activity.model";
import type { ActivityReadModel } from "./activity.read-model";

export interface WorkspaceActivityRepository {
	save: (activity: WorkspaceActivity) => Promise<void>;
	getRecentByWorkspace: (params: {
		workspaceId: string;
		limit: number;
	}) => Promise<ActivityReadModel[]>;
}
