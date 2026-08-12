import { type Static, Type as t } from "@sinclair/typebox";

export const logoUploadUrlBodySchema = t.Object({
	mimeType: t.Union([t.Literal("image/jpeg"), t.Literal("image/png")]),
	fileExtension: t.Union([
		t.Literal("jpg"),
		t.Literal("jpeg"),
		t.Literal("png"),
	]),
});

export type LogoUploadUrlBody = Static<typeof logoUploadUrlBodySchema>;
