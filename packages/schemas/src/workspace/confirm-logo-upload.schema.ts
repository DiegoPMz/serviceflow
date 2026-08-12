import { type Static, Type as t } from "@sinclair/typebox";

export const confirmLogoUploadBodySchema = t.Object({
	fileKey: t.String({ minLength: 1 }),
});

export type ConfirmLogoUploadBody = Static<typeof confirmLogoUploadBodySchema>;
