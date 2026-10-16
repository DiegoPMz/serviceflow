import { describe, expect, test } from "bun:test";
import {
	CLIENT_ERROR_CODES,
	DEVICE_ERROR_CODES,
	ORDER_ERROR_CODES,
	USER_ERROR_CODES,
	WORKSPACE_ERROR_CODES,
} from "./index";

function assertUniqueValues(codes: Record<string, string>, moduleName: string) {
	const values = Object.values(codes);
	expect(new Set(values).size).toBe(values.length);
	for (const value of values) {
		expect(value).toMatch(/^[A-Z][A-Z0-9_]*$/);
		expect(value.length).toBeGreaterThan(0);
	}
}

describe("WORKSPACE_ERROR_CODES", () => {
	test("preserves existing workspace codes", () => {
		expect(WORKSPACE_ERROR_CODES.NAME_REQUIRED).toBe(
			"WORKSPACE_NAME_REQUIRED",
		);
		expect(WORKSPACE_ERROR_CODES.PREFIX_INVALID_FORMAT).toBe(
			"WORKSPACE_PREFIX_INVALID_FORMAT",
		);
		expect(WORKSPACE_ERROR_CODES.LOGO_FILE_NOT_FOUND).toBe(
			"LOGO_FILE_NOT_FOUND",
		);
	});

	test("preserves existing workspace member and invitation codes", () => {
		expect(WORKSPACE_ERROR_CODES.MEMBER_INVALID_ROLE).toBe(
			"MEMBER_INVALID_ROLE",
		);
		expect(WORKSPACE_ERROR_CODES.NOT_A_MEMBER).toBe("NOT_A_MEMBER");
		expect(WORKSPACE_ERROR_CODES.INVITATION_EXPIRED).toBe(
			"INVITATION_EXPIRED",
		);
		expect(WORKSPACE_ERROR_CODES.INSUFFICIENT_PERMISSIONS).toBe(
			"INSUFFICIENT_PERMISSIONS",
		);
	});

	test("has unique values", () => {
		assertUniqueValues(WORKSPACE_ERROR_CODES, "workspace");
	});
});

describe("ORDER_ERROR_CODES", () => {
	test("preserves existing order codes", () => {
		expect(ORDER_ERROR_CODES.CLIENT_ID_REQUIRED).toBe(
			"ORDER_CLIENT_ID_REQUIRED",
		);
		expect(ORDER_ERROR_CODES.NOT_FOUND).toBe("ORDER_NOT_FOUND");
		expect(ORDER_ERROR_CODES.FOLIO_INVALID).toBe("ORDER_FOLIO_INVALID");
	});

	test("has unique values", () => {
		assertUniqueValues(ORDER_ERROR_CODES, "order");
	});
});

describe("CLIENT_ERROR_CODES", () => {
	test("preserves existing client codes", () => {
		expect(CLIENT_ERROR_CODES.ALREADY_EXISTS).toBe("CLIENT_ALREADY_EXISTS");
		expect(CLIENT_ERROR_CODES.PHONE_INVALID).toBe("CLIENT_PHONE_INVALID");
	});

	test("has unique values", () => {
		assertUniqueValues(CLIENT_ERROR_CODES, "client");
	});
});

describe("DEVICE_ERROR_CODES", () => {
	test("preserves existing device codes", () => {
		expect(DEVICE_ERROR_CODES.SERIAL_NUMBER_REQUIRED).toBe(
			"DEVICE_SERIAL_NUMBER_REQUIRED",
		);
		expect(DEVICE_ERROR_CODES.COMPONENT_NOT_FOUND).toBe(
			"DEVICE_COMPONENT_NOT_FOUND",
		);
	});

	test("has unique values", () => {
		assertUniqueValues(DEVICE_ERROR_CODES, "device");
	});
});

describe("USER_ERROR_CODES", () => {
	test("preserves existing user codes", () => {
		expect(USER_ERROR_CODES.EXTERNAL_ID_REQUIRED).toBe(
			"USER_EXTERNAL_ID_REQUIRED",
		);
		expect(USER_ERROR_CODES.NOT_FOUND).toBe("USER_NOT_FOUND");
	});

	test("has unique values", () => {
		assertUniqueValues(USER_ERROR_CODES, "user");
	});
});
