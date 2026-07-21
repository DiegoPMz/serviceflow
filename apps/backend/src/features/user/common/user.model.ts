import { Result } from "@serviceflow/backend/shared/result";
import { ulid } from "ulidx";
import { UserErrors } from "./user.errors";

export const EMAIL_REGEX: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX: RegExp = /^\+[1-9]\d{1,14}$/;

interface CreateUser {
	externalId: string;
	email: string;
	name: string;
	lastName?: string;
	pictureUrl?: string;
	phone?: string;
}

export class User {
	private constructor(
		public readonly id: string,
		public readonly externalId: string,
		public readonly email: string,
		public readonly name: string,
		public readonly lastName: string | null,
		public readonly createdAt: Date,
		public readonly updatedAt: Date,
		public readonly pictureUrl: string | null,
		public readonly phone?: string | null,
	) {}

	static create(data: CreateUser): Result<User> {
		if (!data.externalId || data.externalId.trim().length < 1) {
			return Result.failure(UserErrors.USER_EXTERNAL_ID_REQUIRED);
		}

		if (!data.email || data.email.trim().length < 1) {
			return Result.failure(UserErrors.USER_EMAIL_REQUIRED);
		}

		if (data.email.trim().length > 200) {
			return Result.failure(UserErrors.USER_EMAIL_TOO_LONG);
		}

		if (!EMAIL_REGEX.test(data.email.trim())) {
			return Result.failure(UserErrors.USER_EMAIL_INVALID);
		}

		if (!data.name || data.name.trim().length < 1) {
			return Result.failure(UserErrors.USER_NAME_REQUIRED);
		}

		if (data.name.trim().length > 100) {
			return Result.failure(UserErrors.USER_NAME_TOO_LONG);
		}

		if (data.lastName) {
			if (data.lastName.trim().length < 1) {
				return Result.failure(UserErrors.USER_LAST_NAME_EMPTY);
			}

			if (data.lastName.trim().length > 100) {
				return Result.failure(UserErrors.USER_LAST_NAME_TOO_LONG);
			}
		}

		if (data.phone) {
			if (data.phone.length > 20) {
				return Result.failure(UserErrors.USER_PHONE_TOO_LONG);
			}

			if (!PHONE_REGEX.test(data.phone)) {
				return Result.failure(UserErrors.USER_PHONE_INVALID);
			}
		}

		const now = new Date();
		return Result.success(
			new this(
				ulid(),
				data.externalId.trim(),
				data.email.trim(),
				data.name.trim(),
				data.lastName?.trim() ?? null,
				now,
				now,
				data.pictureUrl?.trim() || null,
				data.phone ? data.phone.trim() : null,
			),
		);
	}
}
