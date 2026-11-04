import {
	createFormHook,
	createFormHookContexts,
	formOptions,
} from "@tanstack/react-form";
import {
	type RegisterClientInput,
	RegisterClientSchema,
} from "./register-client.schema";

export const { fieldContext, formContext, useFieldContext, useFormContext } =
	createFormHookContexts();

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {},
	formComponents: {},
});

const defaultValues: RegisterClientInput = {
	name: "",
	email: "",
	phoneNumber: "",
	location: "",
};

export const registerClientFormOptions = formOptions({
	defaultValues,
	canSubmitWhenInvalid: false,
	validators: {
		onSubmit: RegisterClientSchema,
	},
});
