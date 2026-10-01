import * as v from "valibot";
import { EmailSchema, PhoneSchema } from "@/shared/schemas";

export const AddressSchema = v.pipe(
	v.string("Dirección inválida."),
	v.trim(),
	v.nonEmpty("Campo obligatorio."),
	v.maxLength(255, "Máximo 255 caracteres."),
);

export const CompanyNameSchema = v.pipe(
	v.string("Nombre inválido."),
	v.trim(),
	v.nonEmpty("Campo obligatorio."),
	v.maxLength(150, "Máximo 150 caracteres."),
);

export const CompanyDetailsSchema = v.object({
	name: CompanyNameSchema,
	phone: PhoneSchema,
	email: EmailSchema,
	address: AddressSchema,
});

export const LogoSchema = v.pipe(
	v.file("Archivo inválido."),
	v.mimeType(["image/png", "image/jpeg"], "Solo PNG o JPG."),
	v.maxSize(1 * 1024 * 1024, "Máximo 1 MB."),
);

export const WorkspaceNameSchema = v.pipe(
	v.string("Nombre inválido."),
	v.trim(),
	v.nonEmpty("Campo obligatorio."),
	v.maxLength(250, "Máximo 250 caracteres."),
);

export const CreateWorkspaceSchema = v.object({
	workspaceName: WorkspaceNameSchema,
	companyDetails: CompanyDetailsSchema,
	logoFile: LogoSchema,
});

export type CreateWorkspaceInput = v.InferInput<typeof CreateWorkspaceSchema>;
