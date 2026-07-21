import { describe, expect, test } from "bun:test";
import { UserErrors } from "./user.errors";
import { EMAIL_REGEX, PHONE_REGEX, User } from "./user.model";

const validUserData = () => ({
	externalId: "auth0-abc123",
	email: "juan@example.com",
	name: "Juan",
	lastName: "Pérez",
});

describe("User.create", () => {
	test("Should create a user with valid data", () => {
		const result = User.create(validUserData());

		expect(result.isSuccess).toBe(true);

		const user = result.value;
		expect(user.id).toBeTruthy();
		expect(user.externalId).toBe("auth0-abc123");
		expect(user.email).toBe("juan@example.com");
		expect(user.name).toBe("Juan");
		expect(user.lastName).toBe("Pérez");
		expect(user.pictureUrl).toBeNull();
		expect(user.phone).toBeNull();
		expect(user.createdAt).toBeInstanceOf(Date);
		expect(user.updatedAt).toBeInstanceOf(Date);
		expect(user.createdAt.getTime()).toBe(user.updatedAt.getTime());
	});

	test("Should create a user with optional fields", () => {
		const result = User.create({
			...validUserData(),
			phone: "+5215551234567",
			pictureUrl: "https://example.com/photo.jpg",
			lastName: "Pérez",
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.phone).toBe("+5215551234567");
		expect(result.value.pictureUrl).toBe("https://example.com/photo.jpg");
		expect(result.value.lastName).toBe("Pérez");
	});

	test("Should trim all string fields", () => {
		const result = User.create({
			...validUserData(),
			externalId: "  auth0-abc123  ",
			email: "  juan@example.com  ",
			name: "  Juan  ",
			lastName: "  Pérez  ",
			phone: "+5215551234567",
			pictureUrl: "  https://example.com/photo.jpg  ",
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.externalId).toBe("auth0-abc123");
		expect(result.value.email).toBe("juan@example.com");
		expect(result.value.name).toBe("Juan");
		expect(result.value.lastName).toBe("Pérez");
		expect(result.value.pictureUrl).toBe("https://example.com/photo.jpg");
	});

	test("Should set pictureUrl to null when empty after trim", () => {
		const result = User.create({
			...validUserData(),
			pictureUrl: "  ",
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.pictureUrl).toBeNull();
	});

	test("Should fail when externalId is empty", () => {
		const result = User.create({ ...validUserData(), externalId: "" });
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(UserErrors.USER_EXTERNAL_ID_REQUIRED.code);
	});

	test("Should fail when externalId is whitespace only", () => {
		const result = User.create({ ...validUserData(), externalId: "   " });
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(UserErrors.USER_EXTERNAL_ID_REQUIRED.code);
	});

	test("Should fail when email is empty", () => {
		const result = User.create({ ...validUserData(), email: "" });
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(UserErrors.USER_EMAIL_REQUIRED.code);
	});

	test("Should fail when email is whitespace only", () => {
		const result = User.create({ ...validUserData(), email: "   " });
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(UserErrors.USER_EMAIL_REQUIRED.code);
	});

	test("Should fail when email exceeds 200 characters", () => {
		const result = User.create({
			...validUserData(),
			email: `${"a".repeat(190)}@example.com`,
		});
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(UserErrors.USER_EMAIL_TOO_LONG.code);
	});

	test("Should fail when email has invalid format", () => {
		const result = User.create({
			...validUserData(),
			email: "not-an-email",
		});
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(UserErrors.USER_EMAIL_INVALID.code);
	});

	test("Should validate email with EMAIL_REGEX", () => {
		expect(EMAIL_REGEX.test("juan@example.com")).toBe(true);
		expect(EMAIL_REGEX.test("user.name+tag@domain.co")).toBe(true);
		expect(EMAIL_REGEX.test("not-an-email")).toBe(false);
		expect(EMAIL_REGEX.test("@missing.com")).toBe(false);
		expect(EMAIL_REGEX.test("missing@")).toBe(false);
	});

	test("Should fail when name is empty", () => {
		const result = User.create({ ...validUserData(), name: "" });
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(UserErrors.USER_NAME_REQUIRED.code);
	});

	test("Should fail when name is whitespace only", () => {
		const result = User.create({ ...validUserData(), name: "   " });
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(UserErrors.USER_NAME_REQUIRED.code);
	});

	test("Should fail when name exceeds 100 characters", () => {
		const result = User.create({
			...validUserData(),
			name: "a".repeat(101),
		});
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(UserErrors.USER_NAME_TOO_LONG.code);
	});

	test("Should succeed when name is exactly 100 characters", () => {
		const result = User.create({
			...validUserData(),
			name: "a".repeat(100),
		});
		expect(result.isSuccess).toBe(true);
	});

	test("Should fail when lastName exceeds 100 characters", () => {
		const result = User.create({
			...validUserData(),
			lastName: "a".repeat(101),
		});
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(UserErrors.USER_LAST_NAME_TOO_LONG.code);
	});

	test("Should succeed when lastName is exactly 100 characters", () => {
		const result = User.create({
			...validUserData(),
			lastName: "a".repeat(100),
		});
		expect(result.isSuccess).toBe(true);
	});

	test("Should fail when phone exceeds 20 characters", () => {
		const result = User.create({
			...validUserData(),
			phone: "+".concat("1".repeat(20)),
		});
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(UserErrors.USER_PHONE_TOO_LONG.code);
	});

	test("Should fail when phone is not E.164", () => {
		const result = User.create({
			...validUserData(),
			phone: "5551234567",
		});
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(UserErrors.USER_PHONE_INVALID.code);
	});

	test("Should validate phone with PHONE_REGEX", () => {
		expect(PHONE_REGEX.test("+5215551234567")).toBe(true);
		expect(PHONE_REGEX.test("+1234567890")).toBe(true);
		expect(PHONE_REGEX.test("5551234567")).toBe(false);
		expect(PHONE_REGEX.test("+1234567890123456")).toBe(false);
	});

	test("Should succeed with a valid 15-digit E.164 phone", () => {
		const result = User.create({
			...validUserData(),
			phone: "+5215551234567",
		});
		expect(result.isSuccess).toBe(true);
	});

	test("Should succeed without phone (optional)", () => {
		const result = User.create(validUserData());
		expect(result.isSuccess).toBe(true);
		expect(result.value.phone).toBeNull();
	});
});
