import { type Static, Type as t } from "@sinclair/typebox";

export const createWorkspaceSchema = t.Object({
	name: t.String({ minLength: 1, maxLength: 250 }),
});

export type CreateWorkspaceRequest = Static<typeof createWorkspaceSchema>;
