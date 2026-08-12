import { type Static, Type } from "@sinclair/typebox";

// IDs & Tokens
export const workspaceIdSchema = Type.String({ minLength: 26, maxLength: 26 });
export const invitationTokenSchema = Type.String({ minLength: 1 });

// Workspace
export const workspaceNameSchema = Type.String({
	minLength: 1,
	maxLength: 250,
});

// Company
export const companyNameSchema = Type.String({ minLength: 1, maxLength: 150 });
export const companyPhoneSchema = Type.String({ minLength: 10, maxLength: 16 });
export const companyEmailSchema = Type.String({
	format: "email",
	maxLength: 150,
});
export const companyAddressSchema = Type.String({
	minLength: 1,
	maxLength: 255,
});

// Roles
export const RoleLiteral = {
	owner: Type.Literal("owner"),
	admin: Type.Literal("admin"),
	technician: Type.Literal("technician"),
	viewer: Type.Literal("viewer"),
} as const;

export const workspaceRoleSchema = Type.Union([
	RoleLiteral.owner,
	RoleLiteral.admin,
	RoleLiteral.technician,
	RoleLiteral.viewer,
]);

export type WorkspaceRole = Static<typeof workspaceRoleSchema>;
