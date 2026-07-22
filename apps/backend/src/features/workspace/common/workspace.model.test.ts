import { describe, expect, test } from "bun:test";
import { PREFIX_REGEX, Workspace, WorkspaceCompany } from "./workspace.model";

const ULID_REGEX = /^[0-9A-Z]{26}$/;

const validCompany = (): WorkspaceCompany => {
	return {
		name: "",
		phone: "",
		email: "",
		address: "",
		logoUrl: null,
	};
};

describe("Workspace.create", () => {
	test("Should create a workspace with valid name", () => {
		const result = Workspace.create({
			name: "My Workspace",
			ownerId: "owner-id",
			workspaceCompany: validCompany(),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.name).toBe("My Workspace");
		expect(ULID_REGEX.test(result.value.id)).toBe(true);
		expect(result.value.createdAt).toBeInstanceOf(Date);
		expect(result.value.updatedAt).toBeInstanceOf(Date);
	});

	test("Should return WORKSPACE_NAME_REQUIRED when name is empty", () => {
		const result = Workspace.create({
			name: "",
			ownerId: "owner-id",
			workspaceCompany: validCompany(),
		});

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("WORKSPACE_NAME_REQUIRED");
	});

	test("Should return WORKSPACE_NAME_REQUIRED when name is whitespace only", () => {
		const result = Workspace.create({
			name: "   ",
			ownerId: "owner-id",
			workspaceCompany: validCompany(),
		});

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("WORKSPACE_NAME_REQUIRED");
	});

	test("Should return WORKSPACE_NAME_TOO_LONG when name exceeds 250 chars", () => {
		const result = Workspace.create({
			name: "a".repeat(251),
			ownerId: "owner-id",
			workspaceCompany: validCompany(),
		});

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("WORKSPACE_NAME_TOO_LONG");
	});

	test("Should succeed when name is exactly 250 chars", () => {
		const result = Workspace.create({
			name: "a".repeat(250),
			ownerId: "owner-id",
			workspaceCompany: validCompany(),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.name).toBe("a".repeat(250));
		expect(result.value.name.length).toBe(250);
	});

	test("Should trim leading and trailing whitespace from name", () => {
		const result = Workspace.create({
			name: "  Trimmed  ",
			ownerId: "owner-id",
			workspaceCompany: validCompany(),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.name).toBe("Trimmed");
	});

	test("Should succeed with name containing special characters", () => {
		const result = Workspace.create({
			name: "Workspace @#$%^&*()",
			ownerId: "owner-id",
			workspaceCompany: validCompany(),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.name).toBe("Workspace @#$%^&*()");
	});

	test("Should succeed with name containing unicode characters", () => {
		const result = Workspace.create({
			name: "Español ñáéíóú",
			ownerId: "owner-id",
			workspaceCompany: validCompany(),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.name).toBe("Español ñáéíóú");
	});

	test("Should succeed with name containing numbers", () => {
		const result = Workspace.create({
			name: "Workspace 12345",
			ownerId: "owner-id",
			workspaceCompany: validCompany(),
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.name).toBe("Workspace 12345");
	});

	test("Should generate a valid UUID", () => {
		const result = Workspace.create({
			name: "UUID Test",
			ownerId: "owner-id",
			workspaceCompany: validCompany(),
		});

		expect(result.isSuccess).toBe(true);
		expect(ULID_REGEX.test(result.value.id)).toBe(true);
	});

	test("Should set createdAt equal to updatedAt on creation", () => {
		const result = Workspace.create({
			name: "Timestamp Test",
			ownerId: "owner-id",
			workspaceCompany: validCompany(),
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
					workspaceCompany: validCompany(),
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
					workspaceCompany: validCompany(),
				});
				expect(result.isSuccess).toBe(true);
				prefixes.add(result.value.prefix);
			}
			expect(prefixes.size).toBeGreaterThan(1);
		});
	});
});

describe("WorkspaceCompany.create", () => {
	const validCompanyData = {
		name: "Mi Empresa",
		phone: "+521234567890",
		email: "contacto@empresa.com",
		address: "Calle Principal 123",
	};

	test("Should create a company with valid data", () => {
		const result = WorkspaceCompany.create(validCompanyData);

		expect(result.isSuccess).toBe(true);
		expect(result.value.name).toBe("Mi Empresa");
		expect(result.value.phone).toBe("+521234567890");
		expect(result.value.email).toBe("contacto@empresa.com");
		expect(result.value.address).toBe("Calle Principal 123");
		expect(result.value.logoUrl).toBeNull();
	});

	test("Should trim whitespace from all fields", () => {
		const result = WorkspaceCompany.create({
			name: "  Mi Empresa  ",
			phone: "  +521234567890  ",
			email: "  contacto@empresa.com  ",
			address: "  Calle Principal 123  ",
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.name).toBe("Mi Empresa");
		expect(result.value.phone).toBe("+521234567890");
		expect(result.value.email).toBe("contacto@empresa.com");
		expect(result.value.address).toBe("Calle Principal 123");
	});

	test("Should set logoUrl to null initially", () => {
		const result = WorkspaceCompany.create(validCompanyData);

		expect(result.isSuccess).toBe(true);
		expect(result.value.logoUrl).toBeNull();
	});

	describe("Name validation", () => {
		test("Should return WORKSPACE_COMPANY_NAME_REQUIRED when name is empty", () => {
			const result = WorkspaceCompany.create({
				...validCompanyData,
				name: "",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("WORKSPACE_COMPANY_NAME_REQUIRED");
		});

		test("Should return WORKSPACE_COMPANY_NAME_REQUIRED when name is whitespace only", () => {
			const result = WorkspaceCompany.create({
				...validCompanyData,
				name: "   ",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("WORKSPACE_COMPANY_NAME_REQUIRED");
		});

		test("Should return WORKSPACE_COMPANY_NAME_TOO_LONG when name exceeds 250 chars", () => {
			const result = WorkspaceCompany.create({
				...validCompanyData,
				name: "a".repeat(251),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("WORKSPACE_COMPANY_NAME_TOO_LONG");
		});

		test("Should succeed when name is exactly 250 chars", () => {
			const result = WorkspaceCompany.create({
				...validCompanyData,
				name: "a".repeat(250),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.name.length).toBe(250);
		});
	});

	describe("Phone validation", () => {
		test("Should return WORKSPACE_COMPANY_PHONE_REQUIRED when phone is empty", () => {
			const result = WorkspaceCompany.create({
				...validCompanyData,
				phone: "",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("WORKSPACE_COMPANY_PHONE_REQUIRED");
		});

		test("Should return WORKSPACE_COMPANY_PHONE_REQUIRED when phone is whitespace only", () => {
			const result = WorkspaceCompany.create({
				...validCompanyData,
				phone: "   ",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("WORKSPACE_COMPANY_PHONE_REQUIRED");
		});

		test("Should return WORKSPACE_COMPANY_PHONE_INVALID when phone has no + prefix", () => {
			const result = WorkspaceCompany.create({
				...validCompanyData,
				phone: "521234567890",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("WORKSPACE_COMPANY_PHONE_INVALID");
		});

		test("Should return WORKSPACE_COMPANY_PHONE_INVALID when phone starts with 0", () => {
			const result = WorkspaceCompany.create({
				...validCompanyData,
				phone: "+0123456789",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("WORKSPACE_COMPANY_PHONE_INVALID");
		});

		test("Should return WORKSPACE_COMPANY_PHONE_INVALID when phone has more than 15 digits", () => {
			const result = WorkspaceCompany.create({
				...validCompanyData,
				phone: "+1123456789012345",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("WORKSPACE_COMPANY_PHONE_INVALID");
		});

		test("Should succeed with valid international phone formats", () => {
			const validPhones = [
				"+1234567890",
				"+521234567890",
				"+112345678901234",
				"+919876543210",
			];

			for (const phone of validPhones) {
				const result = WorkspaceCompany.create({
					...validCompanyData,
					phone,
				});
				expect(result.isSuccess).toBe(true);
				expect(result.value.phone).toBe(phone);
			}
		});
	});

	describe("Email validation", () => {
		test("Should return WORKSPACE_COMPANY_EMAIL_REQUIRED when email is empty", () => {
			const result = WorkspaceCompany.create({
				...validCompanyData,
				email: "",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("WORKSPACE_COMPANY_EMAIL_REQUIRED");
		});

		test("Should return WORKSPACE_COMPANY_EMAIL_REQUIRED when email is whitespace only", () => {
			const result = WorkspaceCompany.create({
				...validCompanyData,
				email: "   ",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("WORKSPACE_COMPANY_EMAIL_REQUIRED");
		});

		test("Should return WORKSPACE_COMPANY_EMAIL_INVALID when email has no @", () => {
			const result = WorkspaceCompany.create({
				...validCompanyData,
				email: "empresa.com",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("WORKSPACE_COMPANY_EMAIL_INVALID");
		});

		test("Should return WORKSPACE_COMPANY_EMAIL_INVALID when email has no domain", () => {
			const result = WorkspaceCompany.create({
				...validCompanyData,
				email: "empresa@",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("WORKSPACE_COMPANY_EMAIL_INVALID");
		});

		test("Should return WORKSPACE_COMPANY_EMAIL_INVALID when email has spaces", () => {
			const result = WorkspaceCompany.create({
				...validCompanyData,
				email: "empresa @example.com",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("WORKSPACE_COMPANY_EMAIL_INVALID");
		});

		test("Should succeed with valid email formats", () => {
			const validEmails = [
				"test@example.com",
				"user.name@domain.co",
				"empresa+tag@gmail.com",
				"info@company.org.mx",
			];

			for (const email of validEmails) {
				const result = WorkspaceCompany.create({
					...validCompanyData,
					email,
				});
				expect(result.isSuccess).toBe(true);
				expect(result.value.email).toBe(email);
			}
		});
	});

	describe("Address validation", () => {
		test("Should return WORKSPACE_COMPANY_ADDRESS_REQUIRED when address is empty", () => {
			const result = WorkspaceCompany.create({
				...validCompanyData,
				address: "",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("WORKSPACE_COMPANY_ADDRESS_REQUIRED");
		});

		test("Should return WORKSPACE_COMPANY_ADDRESS_REQUIRED when address is whitespace only", () => {
			const result = WorkspaceCompany.create({
				...validCompanyData,
				address: "   ",
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("WORKSPACE_COMPANY_ADDRESS_REQUIRED");
		});

		test("Should return WORKSPACE_COMPANY_ADDRESS_TOO_LONG when address exceeds 255 chars", () => {
			const result = WorkspaceCompany.create({
				...validCompanyData,
				address: "a".repeat(256),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("WORKSPACE_COMPANY_ADDRESS_TOO_LONG");
		});

		test("Should succeed when address is exactly 255 chars", () => {
			const result = WorkspaceCompany.create({
				...validCompanyData,
				address: "a".repeat(255),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.address.length).toBe(255);
		});
	});
});
