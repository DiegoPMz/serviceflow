import { type Static, Type } from "@sinclair/typebox";
import {
	companyAddressSchema,
	companyEmailSchema,
	companyNameSchema,
	companyPhoneSchema,
	workspaceNameSchema,
} from "./workspace.primitives";

export const createWorkspaceBodySchema = Type.Object({
	workspaceName: workspaceNameSchema,
	companyDetails: Type.Object({
		name: companyNameSchema,
		phone: companyPhoneSchema,
		email: companyEmailSchema,
		address: companyAddressSchema,
	}),
});

export type CreateWorkspaceRequest = Static<typeof createWorkspaceBodySchema>;
