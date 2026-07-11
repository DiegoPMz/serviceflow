import { describe, expect, test } from "bun:test";
import { PREFIX_REGEX, Workspace } from "./workspace.model";

const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("Workspace.create", () => {
	test("Should create a workspace with valid name", () => {
		const result = Workspace.create({ name: "My Workspace" });

		expect(result.isSuccess).toBe(true);
		expect(result.value.name).toBe("My Workspace");
		expect(UUID_REGEX.test(result.value.id)).toBe(true);
		expect(result.value.createdAt).toBeInstanceOf(Date);
		expect(result.value.updatedAt).toBeInstanceOf(Date);
	});

	test("Should return WORKSPACE_NAME_REQUIRED when name is empty", () => {
		const result = Workspace.create({ name: "" });

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("WORKSPACE_NAME_REQUIRED");
	});

	test("Should return WORKSPACE_NAME_REQUIRED when name is whitespace only", () => {
		const result = Workspace.create({ name: "   " });

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("WORKSPACE_NAME_REQUIRED");
	});

	test("Should return WORKSPACE_NAME_TOO_LONG when name exceeds 250 chars", () => {
		const result = Workspace.create({ name: "a".repeat(251) });

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("WORKSPACE_NAME_TOO_LONG");
	});

	test("Should succeed when name is exactly 250 chars", () => {
		const result = Workspace.create({ name: "a".repeat(250) });

		expect(result.isSuccess).toBe(true);
		expect(result.value.name).toBe("a".repeat(250));
		expect(result.value.name.length).toBe(250);
	});

	test("Should trim leading and trailing whitespace from name", () => {
		const result = Workspace.create({ name: "  Trimmed  " });

		expect(result.isSuccess).toBe(true);
		expect(result.value.name).toBe("Trimmed");
	});

	test("Should succeed with name containing special characters", () => {
		const result = Workspace.create({ name: "Workspace @#$%^&*()" });

		expect(result.isSuccess).toBe(true);
		expect(result.value.name).toBe("Workspace @#$%^&*()");
	});

	test("Should succeed with name containing unicode characters", () => {
		const result = Workspace.create({ name: "Español ñáéíóú" });

		expect(result.isSuccess).toBe(true);
		expect(result.value.name).toBe("Español ñáéíóú");
	});

	test("Should succeed with name containing numbers", () => {
		const result = Workspace.create({ name: "Workspace 12345" });

		expect(result.isSuccess).toBe(true);
		expect(result.value.name).toBe("Workspace 12345");
	});

	test("Should generate a valid UUID", () => {
		const result = Workspace.create({ name: "UUID Test" });

		expect(result.isSuccess).toBe(true);
		expect(UUID_REGEX.test(result.value.id)).toBe(true);
	});

	test("Should set createdAt as Date instance", () => {
		const result = Workspace.create({ name: "Date Test" });

		expect(result.isSuccess).toBe(true);
		expect(result.value.createdAt).toBeInstanceOf(Date);
	});

	test("Should set updatedAt as Date instance", () => {
		const result = Workspace.create({ name: "Date Test" });

		expect(result.isSuccess).toBe(true);
		expect(result.value.updatedAt).toBeInstanceOf(Date);
	});

	test("Should set createdAt equal to updatedAt on creation", () => {
		const result = Workspace.create({ name: "Timestamp Test" });

		expect(result.isSuccess).toBe(true);
		expect(result.value.createdAt).toEqual(result.value.updatedAt);
	});

	test("Should return undefined when accessing value on failure", () => {
		const result = Workspace.create({ name: "" });

		expect(result.isFailure).toBe(true);
		expect(result.value).toBeUndefined();
	});

	test("Should return undefined when accessing error on success", () => {
		const result = Workspace.create({ name: "Valid" });

		expect(result.isSuccess).toBe(true);
		expect(result.error).toBeUndefined();
	});
});

describe("Workspace.create - prefix generation", () => {
	test("Should generate prefix when not provided", () => {
		const result = Workspace.create({ name: "Test Workspace" });

		expect(result.isSuccess).toBe(true);
		expect(PREFIX_REGEX.test(result.value.prefix)).toBe(true);
		expect(result.value.prefix.length).toBeGreaterThanOrEqual(4);
		expect(result.value.prefix.length).toBeLessThanOrEqual(6);
	});

	test("Should generate prefix with only uppercase letters A-Z", () => {
		for (let i = 0; i < 100; i++) {
			const result = Workspace.create({ name: `Test ${i}` });
			expect(result.isSuccess).toBe(true);
			expect(PREFIX_REGEX.test(result.value.prefix)).toBe(true);
		}
	});

	test("Should generate different prefixes on multiple calls", () => {
		const prefixes = new Set<string>();
		for (let i = 0; i < 50; i++) {
			const result = Workspace.create({ name: `Test ${i}` });
			expect(result.isSuccess).toBe(true);
			prefixes.add(result.value.prefix);
		}
		expect(prefixes.size).toBeGreaterThan(1);
	});
});

describe("Workspace.create - custom prefix validation", () => {
	test("Should return WORKSPACE_PREFIX_REQUIRED when prefix is empty string", () => {
		const result = Workspace.create({ name: "Test", prefix: "" });

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("WORKSPACE_PREFIX_REQUIRED");
	});

	test("Should return WORKSPACE_PREFIX_REQUIRED when prefix is whitespace only", () => {
		const result = Workspace.create({ name: "Test", prefix: "   " });

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("WORKSPACE_PREFIX_REQUIRED");
	});

	test("Should return WORKSPACE_PREFIX_TOO_SHORT when prefix is 3 chars", () => {
		const result = Workspace.create({ name: "Test", prefix: "ABC" });

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("WORKSPACE_PREFIX_TOO_SHORT");
	});

	test("Should return WORKSPACE_PREFIX_TOO_SHORT when prefix is 1 char", () => {
		const result = Workspace.create({ name: "Test", prefix: "A" });

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("WORKSPACE_PREFIX_TOO_SHORT");
	});

	test("Should return WORKSPACE_PREFIX_TOO_LONG when prefix is 7 chars", () => {
		const result = Workspace.create({ name: "Test", prefix: "ABCDEFG" });

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("WORKSPACE_PREFIX_TOO_LONG");
	});

	test("Should return WORKSPACE_PREFIX_TOO_LONG when prefix is 10 chars", () => {
		const result = Workspace.create({ name: "Test", prefix: "ABCDEFGHIJ" });

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("WORKSPACE_PREFIX_TOO_LONG");
	});

	test("Should return WORKSPACE_PREFIX_INVALID_FORMAT when prefix contains lowercase", () => {
		const result = Workspace.create({ name: "Test", prefix: "abcd" });

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("WORKSPACE_PREFIX_INVALID_FORMAT");
	});

	test("Should return WORKSPACE_PREFIX_INVALID_FORMAT when prefix contains numbers", () => {
		const result = Workspace.create({ name: "Test", prefix: "ABC1" });

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("WORKSPACE_PREFIX_INVALID_FORMAT");
	});

	test("Should return WORKSPACE_PREFIX_INVALID_FORMAT when prefix contains special chars", () => {
		const result = Workspace.create({ name: "Test", prefix: "AB@#" });

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("WORKSPACE_PREFIX_INVALID_FORMAT");
	});

	test("Should return WORKSPACE_PREFIX_INVALID_FORMAT when prefix contains spaces", () => {
		const result = Workspace.create({ name: "Test", prefix: "AB CD" });

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("WORKSPACE_PREFIX_INVALID_FORMAT");
	});

	test("Should return WORKSPACE_PREFIX_INVALID_FORMAT when prefix contains underscore", () => {
		const result = Workspace.create({ name: "Test", prefix: "AB_CD" });

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("WORKSPACE_PREFIX_INVALID_FORMAT");
	});

	test("Should return WORKSPACE_PREFIX_INVALID_FORMAT when prefix contains hyphen", () => {
		const result = Workspace.create({ name: "Test", prefix: "AB-CD" });

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("WORKSPACE_PREFIX_INVALID_FORMAT");
	});
});

describe("Workspace.create - valid custom prefixes", () => {
	test("Should accept valid 4-char prefix", () => {
		const result = Workspace.create({ name: "Test", prefix: "ABCD" });

		expect(result.isSuccess).toBe(true);
		expect(result.value.prefix).toBe("ABCD");
	});

	test("Should accept valid 5-char prefix", () => {
		const result = Workspace.create({ name: "Test", prefix: "ABCDE" });

		expect(result.isSuccess).toBe(true);
		expect(result.value.prefix).toBe("ABCDE");
	});

	test("Should accept valid 6-char prefix", () => {
		const result = Workspace.create({ name: "Test", prefix: "ABCDEF" });

		expect(result.isSuccess).toBe(true);
		expect(result.value.prefix).toBe("ABCDEF");
	});

	test("Should trim whitespace from custom prefix", () => {
		const result = Workspace.create({ name: "Test", prefix: "  ABCD  " });

		expect(result.isSuccess).toBe(true);
		expect(result.value.prefix).toBe("ABCD");
	});
});

describe("Workspace prefix immutability", () => {
	test("Should have readonly prefix property", () => {
		const result = Workspace.create({ name: "Test" });
		expect(result.isSuccess).toBe(true);
		expect(result.value.prefix).toBeDefined();
	});
});

describe("Workspace.create - orderCount", () => {
	test("Should default orderCount to 0 when not provided", () => {
		const result = Workspace.create({ name: "Test" });

		expect(result.isSuccess).toBe(true);
		expect(result.value.orderCount).toBe(0);
		expect(typeof result.value.orderCount).toBe("number");
	});

	test("Should accept custom orderCount when provided", () => {
		const result = Workspace.create({ name: "Test", orderCount: 5 });

		expect(result.isSuccess).toBe(true);
		expect(result.value.orderCount).toBe(5);
	});

	test("Should accept orderCount of 0 explicitly", () => {
		const result = Workspace.create({ name: "Test", orderCount: 0 });

		expect(result.isSuccess).toBe(true);
		expect(result.value.orderCount).toBe(0);
	});

	test("Should accept large orderCount", () => {
		const result = Workspace.create({ name: "Test", orderCount: 1000 });

		expect(result.isSuccess).toBe(true);
		expect(result.value.orderCount).toBe(1000);
	});
});
