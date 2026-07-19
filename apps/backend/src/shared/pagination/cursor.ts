import { Result } from "../result";
import { PaginationErrors } from "./pagination.errors";
import type { PaginationCursor, PaginationRequest } from "./types";

export abstract class Cursor {
	static encode<T extends object>(value: T): string {
		return Buffer.from(JSON.stringify(value)).toString("base64");
	}

	static decode<T>(value: string): T | null {
		try {
			return JSON.parse(Buffer.from(value, "base64").toString("utf8")) as T;
		} catch {
			return null;
		}
	}

	static validate<T extends PaginationCursor>(
		pagination: PaginationRequest,
	): Result<T | null> {
		if (!pagination.cursor) return Result.success(null);

		const decodedCursor = Cursor.decode<T>(pagination.cursor);

		if (
			!decodedCursor ||
			decodedCursor.orderBy !== pagination.orderBy ||
			decodedCursor.direction !== pagination.direction
		) {
			return Result.failure(PaginationErrors.PAGINATION_CURSOR_INVALID);
		}

		return Result.success(decodedCursor);
	}
}
