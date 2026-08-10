import { Result } from "@serviceflow/backend/shared/result";
import { nanoid } from "nanoid";
import { workspaceInvitationErrors } from "./workspace-invitation.errors";
import {
	WORKSPACE_ROLES_ARRAY,
	type WorkspaceRole,
} from "./workspace-member.model";

export type InvitationRole = Exclude<WorkspaceRole, "owner">;
const VALID_INVITATION_ROLES: InvitationRole[] = WORKSPACE_ROLES_ARRAY.filter(
	(r) => r !== "owner",
);

const DEFAULT_EXPIRATION_DAYS = 7;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class WorkspaceInvitation {
	public isForEmail(targetEmail: string): boolean {
		return this.email.toLowerCase() === targetEmail.toLowerCase().trim();
	}

	private constructor(
		private _token: string,
		public readonly workspaceId: string,
		public readonly role: InvitationRole,
		public readonly email: string,
		private _expiresAt: Date,
		public readonly createdAt: Date,
		private _expirationDays: number = DEFAULT_EXPIRATION_DAYS,
	) {}

	public get token(): string {
		return this._token;
	}

	public get expirationDays(): number {
		return this._expirationDays;
	}

	public get expiresAt(): Date {
		return this._expiresAt;
	}

	static create({
		email,
		role,
		workspaceId,
		expirationDays,
	}: {
		workspaceId: string;
		role: InvitationRole;
		email: string;
		expirationDays?: number;
	}): Result<WorkspaceInvitation> {
		if (workspaceId.trim().length === 0) {
			return Result.failure(workspaceInvitationErrors.WORKSPACE_ID_REQUIRED);
		}

		if (!email || !EMAIL_REGEX.test(email)) {
			return Result.failure(workspaceInvitationErrors.INVALID_EMAIL);
		}

		if (!VALID_INVITATION_ROLES.includes(role)) {
			return Result.failure(workspaceInvitationErrors.INVALID_ROLE);
		}

		if (expirationDays !== undefined && expirationDays < 1) {
			return Result.failure(workspaceInvitationErrors.INVALID_EXPIRATION_DAYS);
		}

		const now = new Date();
		const days = expirationDays ?? DEFAULT_EXPIRATION_DAYS;

		const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

		return Result.success(
			new WorkspaceInvitation(
				nanoid(21),
				workspaceId.trim(),
				role,
				email.toLowerCase().trim(),
				expiresAt,
				now,
				expirationDays,
			),
		);
	}

	static reconstitute(props: {
		token: string;
		workspaceId: string;
		role: InvitationRole;
		email: string;
		expiresAt: Date;
		createdAt: Date;
		expirationDays: number;
	}): WorkspaceInvitation {
		return new WorkspaceInvitation(
			props.token,
			props.workspaceId,
			props.role,
			props.email,
			props.expiresAt,
			props.createdAt,
			props.expirationDays,
		);
	}

	public isExpired(now: Date = new Date()): boolean {
		return now.getTime() > this.expiresAt.getTime();
	}

	public renew(options?: { rotateToken?: boolean }): void {
		const shouldRotate = options?.rotateToken ?? true;
		const now = new Date();

		this._expiresAt = new Date(
			now.getTime() + this._expirationDays * 24 * 60 * 60 * 1000,
		);

		if (shouldRotate) {
			this._token = nanoid(21);
		}
	}
}
