import { Result } from "@serviceflow/backend/shared/result";
import { ulid } from "ulidx";
import { workspaceErrors } from "./workspace.errors";

export interface CreateWorkspaceData {
	name: string;
	ownerId: string;
}

export const PREFIX_REGEX: RegExp = /^[A-Z]{4,6}$/;

export class Workspace {
	private constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly createdAt: Date,
		public readonly updatedAt: Date,

		private _orderCount: number,
		public readonly prefix: string,

		public readonly ownerId: string,
	) {}

	get orderCount(): number {
		return this._orderCount;
	}

	increaseCount() {
		this._orderCount += 1;
	}

	static reconstitute(data: {
		id: string;
		name: string;
		createdAt: Date;
		updatedAt: Date;
		orderCount: number;
		prefix: string;
		ownerId: string;
	}): Workspace {
		return new Workspace(
			data.id,
			data.name,
			data.createdAt,
			data.updatedAt,
			data.orderCount,
			data.prefix,
			data.ownerId,
		);
	}

	static create(data: CreateWorkspaceData): Result<Workspace> {
		if (!data.name || data.name.trim().length < 1) {
			return Result.failure(workspaceErrors.WORKSPACE_NAME_REQUIRED);
		}

		if (data.name.trim().length > 250) {
			return Result.failure(workspaceErrors.WORKSPACE_NAME_TOO_LONG);
		}

		if (!data.ownerId) {
			return Result.failure(workspaceErrors.WORKSPACE_OWNER_REQUIRED);
		}

		const now = new Date();
		return Result.success(
			new Workspace(
				ulid(),
				data.name.trim(),
				now,
				now,
				0,
				Workspace.generatePrefix(),
				data.ownerId,
			),
		);
	}

	private static generatePrefix(): string {
		const length = 4 + Math.floor(Math.random() * 3);
		const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		const randomValues = crypto.getRandomValues(new Uint8Array(length));
		let result = "";
		for (let i = 0; i < length; i++) {
			result += chars[randomValues[i]! % chars.length];
		}
		return result;
	}
}
