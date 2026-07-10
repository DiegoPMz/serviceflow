import { Result } from "@serviceflow/backend/shared/result";
import { randomUUIDv7 } from "bun";
import { workspaceErrors } from "./workspace.errors";

export class Workspace {
	private constructor(
		public id: string,
		public name: string,
		public createdAt: Date,
		public updatedAt: Date,
	) {}

	static create(
		data: Omit<Workspace, "id" | "createdAt" | "updatedAt">,
	): Result<Workspace> {
		if (!data.name || data.name.trim().length < 1) {
			return Result.failure(workspaceErrors.WORKSPACE_NAME_REQUIRED);
		}

		if (data.name.trim().length > 250) {
			return Result.failure(workspaceErrors.WORKSPACE_NAME_TOO_LONG);
		}

		const now = new Date();
		return Result.success(
			new Workspace(randomUUIDv7(), data.name.trim(), now, now),
		);
	}
}
