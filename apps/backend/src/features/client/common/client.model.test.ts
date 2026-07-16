import { describe, expect, test } from "bun:test";
import { ClientErrors } from "./client.errors";
import { Client, EMAIL_REGEX, PHONE_REGEX } from "./client.model";

const validClientData = () => ({
	name: "Juan Pérez",
	email: "juan@example.com",
	phoneNumber: "+5215551234567",
	workspaceId: "workspace-123",
	location: "CDMX",
});

describe("Client.create", () => {
	test("Should create a client with valid data", () => {
		const result = Client.create(validClientData());

		expect(result.isSuccess).toBe(true);

		const client = result.value;
		expect(client.name).toBe("Juan Pérez");
		expect(client.email).toBe("juan@example.com");
		expect(client.phoneNumber).toBe("+5215551234567");
		expect(client.workspaceId).toBe("workspace-123");
		expect(client.location).toBe("CDMX");
		expect(client.id).toBeTruthy();
		expect(client.createdAt).toBeInstanceOf(Date);
		expect(client.updatedAt).toBeInstanceOf(Date);
		expect(client.createdAt.getTime()).toBe(client.updatedAt.getTime());
	});

	test("Should trim name, email, phoneNumber and location", () => {
		const result = Client.create({
			...validClientData(),
			name: "  Juan Pérez  ",
			email: "  juan@example.com  ",
			phoneNumber: "  +5215551234567  ",
			location: "  CDMX  ",
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.name).toBe("Juan Pérez");
		expect(result.value.email).toBe("juan@example.com");
		expect(result.value.phoneNumber).toBe("+5215551234567");
		expect(result.value.location).toBe("CDMX");
	});

	test("Should fail when name is empty", () => {
		const result = Client.create({ ...validClientData(), name: "" });
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(ClientErrors.CLIENT_NAME_REQUIRED.code);
	});

	test("Should fail when name is whitespace only", () => {
		const result = Client.create({ ...validClientData(), name: "   " });
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(ClientErrors.CLIENT_NAME_REQUIRED.code);
	});

	test("Should fail when name exceeds 150 characters", () => {
		const result = Client.create({
			...validClientData(),
			name: "a".repeat(151),
		});
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(ClientErrors.CLIENT_NAME_TOO_LONG.code);
	});

	test("Should succeed when name is exactly 150 characters", () => {
		const result = Client.create({
			...validClientData(),
			name: "a".repeat(150),
		});
		expect(result.isSuccess).toBe(true);
	});

	test("Should fail when email is empty", () => {
		const result = Client.create({ ...validClientData(), email: "" });
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(ClientErrors.CLIENT_EMAIL_REQUIRED.code);
	});

	test("Should fail when email is whitespace only", () => {
		const result = Client.create({ ...validClientData(), email: "   " });
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(ClientErrors.CLIENT_EMAIL_REQUIRED.code);
	});

	test("Should fail when email has invalid format", () => {
		const result = Client.create({
			...validClientData(),
			email: "not-an-email",
		});
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(ClientErrors.CLIENT_EMAIL_INVALID.code);
	});

	test("Should validate email with EMAIL_REGEX", () => {
		expect(EMAIL_REGEX.test("juan@example.com")).toBe(true);
		expect(EMAIL_REGEX.test("not-an-email")).toBe(false);
	});

	test("Should fail when email exceeds 200 characters", () => {
		const result = Client.create({
			...validClientData(),
			email: `a${"b".repeat(200)}@example.com`,
		});
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(ClientErrors.CLIENT_EMAIL_TOO_LONG.code);
	});

	test("Should fail when phoneNumber is empty", () => {
		const result = Client.create({ ...validClientData(), phoneNumber: "" });
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(ClientErrors.CLIENT_PHONE_REQUIRED.code);
	});

	test("Should fail when phoneNumber is whitespace only", () => {
		const result = Client.create({ ...validClientData(), phoneNumber: "   " });
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(ClientErrors.CLIENT_PHONE_REQUIRED.code);
	});

	test("Should fail when phoneNumber is not E.164", () => {
		const result = Client.create({
			...validClientData(),
			phoneNumber: "5551234567",
		});
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(ClientErrors.CLIENT_PHONE_INVALID.code);
	});

	test("Should validate phoneNumber with PHONE_REGEX", () => {
		expect(PHONE_REGEX.test("+5215551234567")).toBe(true);
		expect(PHONE_REGEX.test("5551234567")).toBe(false);
		expect(PHONE_REGEX.test("+1234567890123456")).toBe(false);
	});

	test("Should fail when phoneNumber exceeds 20 characters", () => {
		const result = Client.create({
			...validClientData(),
			phoneNumber: "+".concat("1".repeat(20)),
		});
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(ClientErrors.CLIENT_PHONE_TOO_LONG.code);
	});

	test("Should succeed with a valid 15-digit E.164 phone", () => {
		const result = Client.create({
			...validClientData(),
			phoneNumber: "+5215551234567",
		});
		expect(result.isSuccess).toBe(true);
	});

	test("Should fail when workspaceId is empty", () => {
		const result = Client.create({ ...validClientData(), workspaceId: "" });
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(
			ClientErrors.CLIENT_WORKSPACE_ID_REQUIRED.code,
		);
	});

	test("Should fail when workspaceId is whitespace only", () => {
		const result = Client.create({
			...validClientData(),
			workspaceId: "   ",
		});
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(
			ClientErrors.CLIENT_WORKSPACE_ID_REQUIRED.code,
		);
	});

	test("Should fail when location is empty", () => {
		const result = Client.create({ ...validClientData(), location: "" });
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(ClientErrors.CLIENT_LOCATION_REQUIRED.code);
	});

	test("Should fail when location is whitespace only", () => {
		const result = Client.create({ ...validClientData(), location: "   " });
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(ClientErrors.CLIENT_LOCATION_REQUIRED.code);
	});
});
