import { describe, expect, test } from "bun:test";
import { PREFIX_REGEX, Workspace } from "./workspace.model";

const ULID_REGEX = /^[0-9A-Z]{26}$/;

describe("Workspace.create", () => {
	test("Should create a workspace with valid name", () => {
		const result = Workspace.create({
			name: "My Workspace",
			ownerId: "owner-id",
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.name).toBe("My Workspace");
		expect(ULID_REGEX.test(result.value.id)).toBe(true);
		expect(result.value.createdAt).toBeInstanceOf(Date);
		expect(result.value.updatedAt).toBeInstanceOf(Date);
	});

	test("Should return WORKSPACE_NAME_REQUIRED when name is empty", () => {
		const result = Workspace.create({ name: "", ownerId: "owner-id" });

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("WORKSPACE_NAME_REQUIRED");
	});

	test("Should return WORKSPACE_NAME_REQUIRED when name is whitespace only", () => {
		const result = Workspace.create({ name: "   ", ownerId: "owner-id" });

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("WORKSPACE_NAME_REQUIRED");
	});

	test("Should return WORKSPACE_NAME_TOO_LONG when name exceeds 250 chars", () => {
		const result = Workspace.create({
			name: "a".repeat(251),
			ownerId: "owner-id",
		});

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("WORKSPACE_NAME_TOO_LONG");
	});

	test("Should succeed when name is exactly 250 chars", () => {
		const result = Workspace.create({
			name: "a".repeat(250),
			ownerId: "owner-id",
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.name).toBe("a".repeat(250));
		expect(result.value.name.length).toBe(250);
	});

	test("Should trim leading and trailing whitespace from name", () => {
		const result = Workspace.create({
			name: "  Trimmed  ",
			ownerId: "owner-id",
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.name).toBe("Trimmed");
	});

	test("Should succeed with name containing special characters", () => {
		const result = Workspace.create({
			name: "Workspace @#$%^&*()",
			ownerId: "owner-id",
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.name).toBe("Workspace @#$%^&*()");
	});

	test("Should succeed with name containing unicode characters", () => {
		const result = Workspace.create({
			name: "Español ñáéíóú",
			ownerId: "owner-id",
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.name).toBe("Español ñáéíóú");
	});

	test("Should succeed with name containing numbers", () => {
		const result = Workspace.create({
			name: "Workspace 12345",
			ownerId: "owner-id",
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.name).toBe("Workspace 12345");
	});

	test("Should generate a valid UUID", () => {
		const result = Workspace.create({ name: "UUID Test", ownerId: "owner-id" });

		expect(result.isSuccess).toBe(true);
		expect(ULID_REGEX.test(result.value.id)).toBe(true);
	});

	test("Should set createdAt equal to updatedAt on creation", () => {
		const result = Workspace.create({
			name: "Timestamp Test",
			ownerId: "owner-id",
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.createdAt).toEqual(result.value.updatedAt);
	});

	describe("Workspace.create - prefix generation", () => {
		test("Should generate prefix with only uppercase letters A-Z", () => {
			for (let i = 0; i < 100; i++) {
				const result = Workspace.create({
					name: `Test ${i}`,
					ownerId: "owner-id",
				});
				expect(result.isSuccess).toBe(true);
				expect(PREFIX_REGEX.test(result.value.prefix)).toBe(true);
			}
		});

		test("Should generate different prefixes on multiple calls", () => {
			const prefixes = new Set<string>();
			for (let i = 0; i < 50; i++) {
				const result = Workspace.create({
					name: `Test ${i}`,
					ownerId: "owner-id",
				});
				expect(result.isSuccess).toBe(true);
				prefixes.add(result.value.prefix);
			}
			expect(prefixes.size).toBeGreaterThan(1);
		});
	});
});
