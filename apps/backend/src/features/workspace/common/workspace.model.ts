import { Result } from "@serviceflow/backend/shared/result";
import { randomUUIDv7 } from "bun";
import { workspaceErrors } from "./workspace.errors";

export interface CreateWorkspaceData {
	name: string;
	prefix?: string;
	orderCount?: number;
}

export const PREFIX_REGEX: RegExp = /^[A-Z]{4,6}$/;

export class Workspace {
	private constructor(
		public id: string,
		public name: string,
		public createdAt: Date,
		public updatedAt: Date,

		public orderCount: number,
		public readonly prefix: string,
	) {}

	static create(data: CreateWorkspaceData): Result<Workspace> {
		if (!data.name || data.name.trim().length < 1) {
			return Result.failure(workspaceErrors.WORKSPACE_NAME_REQUIRED);
		}

		if (data.name.trim().length > 250) {
			return Result.failure(workspaceErrors.WORKSPACE_NAME_TOO_LONG);
		}

		const prefixResult = Workspace.validateOrGeneratePrefix(data.prefix);
		if (prefixResult.isFailure) {
			return Result.failure(prefixResult.error);
		}

		const now = new Date();
		return Result.success(
			new Workspace(
				randomUUIDv7(),
				data.name.trim(),
				now,
				now,
				data.orderCount ?? 0,
				prefixResult.value,
			),
		);
	}

	private static validateOrGeneratePrefix(prefix?: string): Result<string> {
		if (prefix !== undefined) {
			if (!prefix || prefix.trim().length === 0) {
				return Result.failure(workspaceErrors.WORKSPACE_PREFIX_REQUIRED);
			}

			const trimmedPrefix = prefix.trim();

			if (trimmedPrefix.length < 4) {
				return Result.failure(workspaceErrors.WORKSPACE_PREFIX_TOO_SHORT);
			}

			if (trimmedPrefix.length > 6) {
				return Result.failure(workspaceErrors.WORKSPACE_PREFIX_TOO_LONG);
			}

			if (!PREFIX_REGEX.test(trimmedPrefix)) {
				return Result.failure(workspaceErrors.WORKSPACE_PREFIX_INVALID_FORMAT);
			}

			return Result.success(trimmedPrefix);
		}

		return Result.success(Workspace.generatePrefix());
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
