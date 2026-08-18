import { type Static, Type } from "@sinclair/typebox";
import { RoleLiteral } from "./workspace.primitives";

export const updateWorkspaceMemberRoleBodySchema = Type.Object({
	role: Type.Union([
		RoleLiteral.admin,
		RoleLiteral.technician,
		RoleLiteral.viewer,
	]),
});

export type UpdateWorkspaceMemberRoleBody = Static<
	typeof updateWorkspaceMemberRoleBodySchema
>;
