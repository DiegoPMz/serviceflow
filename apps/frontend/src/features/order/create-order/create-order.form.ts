import {
	createFormHook,
	createFormHookContexts,
	formOptions,
} from "@tanstack/react-form";
import { PhotoCaptureField } from "./components/photo-capture-field";
import { SignatureCaptureField } from "./components/signature-capture-field";
import {
	CreateOrderFormSchema,
	type CreateOrderFormValues,
} from "./create-order.schema";

export const { fieldContext, formContext, useFieldContext, useFormContext } =
	createFormHookContexts();

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {
		PhotoCaptureField,
		SignatureCaptureField,
	},
	formComponents: {},
});

export const createOrderDefaultValues: CreateOrderFormValues = {
	clientId: "",
	deviceId: "",
	serviceType: "" as CreateOrderFormValues["serviceType"],
	observations: "",
	components: [],
	photoFile: null,
	signatureDataUrl: null,
} as const;

export const createOrderFormOptions = formOptions({
	defaultValues: createOrderDefaultValues,
	canSubmitWhenInvalid: false,
	validators: {
		onSubmit: CreateOrderFormSchema,
	},
});
