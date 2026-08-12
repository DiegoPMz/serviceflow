import { type Static, Type } from "@sinclair/typebox";
import { RoleLiteral } from "./workspace.primitives";

export const inviteUserToWorkspaceBodySchema = Type.Object({
	role: Type.Union([
		RoleLiteral.admin,
		RoleLiteral.technician,
		RoleLiteral.viewer,
	]),
	email: Type.String({ format: "email" }),
});

export type InviteUserToWorkspaceBody = Static<
	typeof inviteUserToWorkspaceBodySchema
>;
