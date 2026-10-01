import {
	createFormHook,
	createFormHookContexts,
	formOptions,
} from "@tanstack/react-form";
import { LogoUploadField } from "./components/logo-upload-field";
import {
	type CreateWorkspaceInput,
	CreateWorkspaceSchema,
} from "./create-workspace.schema";

export const { fieldContext, formContext, useFieldContext, useFormContext } =
	createFormHookContexts();

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {
		LogoUploadField,
	},

	formComponents: {},
});

const defaultValues: CreateWorkspaceInput = {
	workspaceName: "",
	companyDetails: {
		name: "",
		phone: "",
		email: "",
		address: "",
	},
	logoFile: undefined as unknown as File,
};

export const createWorkspaceFormOptions = formOptions({
	defaultValues,
	canSubmitWhenInvalid: false,
	validators: {
		onSubmit: CreateWorkspaceSchema,
	},
});
