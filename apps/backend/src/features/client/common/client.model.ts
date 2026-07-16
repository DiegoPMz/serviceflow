import { Result } from "@serviceflow/backend/shared/result";
import { ulid } from "ulidx";
import { ClientErrors } from "./client.errors";

export const EMAIL_REGEX: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX: RegExp = /^\+[1-9]\d{1,14}$/;

type CreateClient = Omit<Client, "id" | "createdAt" | "updatedAt">;

export class Client {
	private constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly email: string,
		public readonly phoneNumber: string,
		public readonly workspaceId: string,
		public readonly location: string,
		public readonly createdAt: Date,
		public readonly updatedAt: Date,
	) {}

	static create({
		email,
		name,
		phoneNumber,
		workspaceId,
		location,
	}: CreateClient): Result<Client> {
		if (!name || name.trim().length < 1) {
			return Result.failure(ClientErrors.CLIENT_NAME_REQUIRED);
		}

		if (name.trim().length > 150) {
			return Result.failure(ClientErrors.CLIENT_NAME_TOO_LONG);
		}

		if (!email || email.trim().length < 1) {
			return Result.failure(ClientErrors.CLIENT_EMAIL_REQUIRED);
		}

		if (email.trim().length > 200) {
			return Result.failure(ClientErrors.CLIENT_EMAIL_TOO_LONG);
		}

		if (!EMAIL_REGEX.test(email.trim())) {
			return Result.failure(ClientErrors.CLIENT_EMAIL_INVALID);
		}

		if (!phoneNumber || phoneNumber.trim().length < 1) {
			return Result.failure(ClientErrors.CLIENT_PHONE_REQUIRED);
		}

		if (phoneNumber.trim().length > 20) {
			return Result.failure(ClientErrors.CLIENT_PHONE_TOO_LONG);
		}

		if (!PHONE_REGEX.test(phoneNumber.trim())) {
			return Result.failure(ClientErrors.CLIENT_PHONE_INVALID);
		}

		if (!workspaceId || workspaceId.trim().length < 1) {
			return Result.failure(ClientErrors.CLIENT_WORKSPACE_ID_REQUIRED);
		}

		if (!location || location.trim().length < 1) {
			return Result.failure(ClientErrors.CLIENT_LOCATION_REQUIRED);
		}

		const now = new Date();

		return Result.success(
			new this(
				ulid(),
				name.trim(),
				email.trim(),
				phoneNumber.trim(),
				workspaceId,
				location.trim(),
				now,
				now,
			),
		);
	}
}
