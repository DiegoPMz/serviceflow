import { Result, Updated } from "@serviceflow/backend/shared/result";
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

export type WorkspaceInvitationStatus =
	| "pending"
	| "accepted"
	| "cancelled"
	| "rejected";

export class WorkspaceInvitation {
	private constructor(
		private _token: string,
		public readonly workspaceId: string,
		public readonly role: InvitationRole,
		public readonly email: string,
		private _expiresAt: Date,
		public readonly createdAt: Date,
		private _expirationDays: number = DEFAULT_EXPIRATION_DAYS,
		public emailId: string | null,
		private _status: WorkspaceInvitationStatus = "pending",
		private _acceptedAt: Date | null = null,
		private _cancelledAt: Date | null = null,
		private _rejectedAt: Date | null = null,
	) {}

	// --- Getters de Solo Lectura ---
	public get token(): string {
		return this._token;
	}

	public get expirationDays(): number {
		return this._expirationDays;
	}

	public get expiresAt(): Date {
		return this._expiresAt;
	}

	public get status(): WorkspaceInvitationStatus {
		return this._status;
	}

	public get acceptedAt(): Date | null {
		return this._acceptedAt;
	}

	public get cancelledAt(): Date | null {
		return this._cancelledAt;
	}

	public get rejectedAt(): Date | null {
		return this._rejectedAt;
	}

	public get isPending(): boolean {
		return this._status === "pending";
	}

	public get isAccepted(): boolean {
		return this._status === "accepted";
	}

	public get isCancelled(): boolean {
		return this._status === "cancelled";
	}

	public get isRejected(): boolean {
		return this._status === "rejected";
	}

	// --- Métodos de Dominio (Transiciones de Estado) ---

	public accept(now: Date = new Date()): Result<Updated> {
		if (this._status === "accepted") {
			return Result.failure(workspaceInvitationErrors.ALREADY_ACCEPTED);
		}

		if (this._status === "cancelled") {
			return Result.failure(workspaceInvitationErrors.ALREADY_CANCELLED);
		}

		if (this._status === "rejected") {
			return Result.failure(workspaceInvitationErrors.ALREADY_REJECTED);
		}

		if (this.isExpired(now)) {
			return Result.failure(workspaceInvitationErrors.EXPIRED);
		}

		this._status = "accepted";
		this._acceptedAt = now;

		return Updated.toResult();
	}

	public cancel(now: Date = new Date()): Result<Updated> {
		if (this._status === "cancelled") {
			return Result.failure(workspaceInvitationErrors.ALREADY_CANCELLED);
		}

		if (this._status === "accepted") {
			return Result.failure(workspaceInvitationErrors.CANNOT_CANCEL_ACCEPTED);
		}

		if (this._status === "rejected") {
			return Result.failure(workspaceInvitationErrors.CANNOT_CANCEL_REJECTED);
		}

		this._status = "cancelled";
		this._cancelledAt = now;

		return Updated.toResult();
	}

	public reject(now: Date = new Date()): Result<Updated> {
		if (this._status === "rejected") {
			return Result.failure(workspaceInvitationErrors.ALREADY_REJECTED);
		}

		if (this._status === "accepted") {
			return Result.failure(workspaceInvitationErrors.ALREADY_ACCEPTED);
		}

		if (this._status === "cancelled") {
			return Result.failure(workspaceInvitationErrors.ALREADY_CANCELLED);
		}

		if (this.isExpired(now)) {
			return Result.failure(workspaceInvitationErrors.EXPIRED);
		}

		this._status = "rejected";
		this._rejectedAt = now;

		return Updated.toResult();
	}

	public renew(options?: { rotateToken?: boolean }): Result<Updated> {
		if (this._status !== "pending") {
			return Result.failure(workspaceInvitationErrors.CANNOT_RENEW_NON_PENDING);
		}

		const shouldRotate = options?.rotateToken ?? true;
		const now = new Date();

		this._expiresAt = new Date(
			now.getTime() + this._expirationDays * 24 * 60 * 60 * 1000,
		);

		if (shouldRotate) {
			this._token = nanoid(21);
		}

		return Updated.toResult();
	}

	// --- Métodos de Consulta y Utilidad ---

	public isExpired(now: Date = new Date()): boolean {
		return now.getTime() > this._expiresAt.getTime();
	}

	public isForEmail(targetEmail: string): boolean {
		return this.email.toLowerCase() === targetEmail.toLowerCase().trim();
	}

	public linkEmail(emailId: string): void {
		this.emailId = emailId;
	}

	// --- Factory Methods ---

	static create({
		email,
		role,
		workspaceId,
		expirationDays,
		emailId,
	}: {
		workspaceId: string;
		role: InvitationRole;
		email: string;
		expirationDays?: number;
		emailId?: string;
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
				emailId ?? null,
				"pending",
				null,
				null,
				null,
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
		emailId: string | null;
		status: WorkspaceInvitationStatus;
		acceptedAt: Date | null;
		cancelledAt: Date | null;
		rejectedAt: Date | null;
	}): WorkspaceInvitation {
		return new WorkspaceInvitation(
			props.token,
			props.workspaceId,
			props.role,
			props.email,
			props.expiresAt,
			props.createdAt,
			props.expirationDays,
			props.emailId,
			props.status,
			props.acceptedAt,
			props.cancelledAt,
			props.rejectedAt,
		);
	}
}
