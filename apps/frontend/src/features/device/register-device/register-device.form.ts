import {
	createFormHook,
	createFormHookContexts,
	formOptions,
} from "@tanstack/react-form";
import { DeviceComponentsField } from "./components/device-components-field";
import {
	type RegisterDeviceInput,
	RegisterDeviceSchema,
} from "./register-device.schema";

export const { fieldContext, formContext, useFieldContext, useFormContext } =
	createFormHookContexts();

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {
		DeviceComponentsField,
	},
	formComponents: {},
});

const defaultValues: RegisterDeviceInput = {
	clientId: "",
	serialNumber: "",
	brand: "",
	model: "",
	components: [],
};

export const registerDeviceFormOptions = formOptions({
	defaultValues,
	canSubmitWhenInvalid: false,
	validators: {
		onSubmit: RegisterDeviceSchema,
	},
});
