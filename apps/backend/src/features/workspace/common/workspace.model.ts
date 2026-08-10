import { Result, Updated } from "@serviceflow/backend/shared/result";
import { ulid } from "ulidx";
import { workspaceErrors } from "./workspace.errors";

export interface CreateWorkspaceData {
	name: string;
	ownerId: string;
	workspaceCompany: WorkspaceCompany;
}

export const PHONE_REGEX: RegExp = /^\+[1-9]\d{1,14}$/;
export const PREFIX_REGEX: RegExp = /^[A-Z]{4,6}$/;
export const EMAIL_REGEX: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Workspace {
	updateLogoKey(key: string): Result<Updated> {
		this.company.logoKey = key;
		this.updatedAt = new Date();

		return Updated.toResult();
	}

	private constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly createdAt: Date,
		public updatedAt: Date,

		private _orderCount: number,
		public readonly prefix: string,

		public readonly ownerId: string,

		public readonly company: WorkspaceCompany,
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
		workspaceCompany: WorkspaceCompany;
	}): Workspace {
		return new Workspace(
			data.id,
			data.name,
			data.createdAt,
			data.updatedAt,
			data.orderCount,
			data.prefix,
			data.ownerId,
			data.workspaceCompany,
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
				data.workspaceCompany,
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

export class WorkspaceCompany {
	private constructor(
		public readonly name: string,
		public readonly phone: string,
		public readonly email: string,
		public readonly address: string,
		public logoKey: string | null,
	) {}

	static create(data: {
		name: string;
		phone: string;
		email: string;
		address: string;
	}): Result<WorkspaceCompany> {
		if (!data.name || data.name.trim().length === 0) {
			return Result.failure(workspaceErrors.WORKSPACE_COMPANY_NAME_REQUIRED);
		}

		if (data.name.trim().length > 250) {
			return Result.failure(workspaceErrors.WORKSPACE_COMPANY_NAME_TOO_LONG);
		}

		if (!data.phone || data.phone.trim().length === 0) {
			return Result.failure(workspaceErrors.WORKSPACE_COMPANY_PHONE_REQUIRED);
		}

		if (!PHONE_REGEX.test(data.phone.trim())) {
			return Result.failure(workspaceErrors.WORKSPACE_COMPANY_PHONE_INVALID);
		}

		if (!data.email || data.email.trim().length === 0) {
			return Result.failure(workspaceErrors.WORKSPACE_COMPANY_EMAIL_REQUIRED);
		}

		if (!EMAIL_REGEX.test(data.email.trim())) {
			return Result.failure(workspaceErrors.WORKSPACE_COMPANY_EMAIL_INVALID);
		}

		if (!data.address || data.address.trim().length === 0) {
			return Result.failure(workspaceErrors.WORKSPACE_COMPANY_ADDRESS_REQUIRED);
		}

		if (data.address.trim().length > 255) {
			return Result.failure(workspaceErrors.WORKSPACE_COMPANY_ADDRESS_TOO_LONG);
		}

		return Result.success(
			new WorkspaceCompany(
				data.name.trim(),
				data.phone.trim(),
				data.email.trim(),
				data.address.trim(),
				null,
			),
		);
	}
}
