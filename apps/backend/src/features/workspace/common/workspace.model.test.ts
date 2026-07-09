import { describe, expect, test } from "bun:test";
import { Workspace } from "./workspace.model";

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
