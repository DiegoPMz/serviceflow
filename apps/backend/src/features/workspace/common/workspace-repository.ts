import type { Workspace } from "./workspace.model";

export interface WorkspaceRepository {
	save: (model: Workspace) => Promise<void>;
	update: (model: Workspace) => Promise<void>;
	getById: (workspaceId: string) => Promise<Workspace | null>;
}
