import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect } from "react";
import type { DeviceListItem } from "@/features/device/paginated-devices";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import {
	Field,
	FieldContent,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import type { Eden } from "@/shared/http/client";
import { registerDeviceFormOptions, useAppForm } from "./register-device.form";
import { useRegisterDevice } from "./register-device.mutation";
import {
	DeviceBrandSchema,
	DeviceModelSchema,
	DeviceSerialNumberSchema,
} from "./register-device.schema";

interface RegisterDeviceDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	workspaceId: string;
	clientId: string;
	eden: Eden;
	onRegistered?: (device: DeviceListItem) => void;
}

export function RegisterDeviceDialog({
	open,
	onOpenChange,
	workspaceId,
	clientId,
	eden,
	onRegistered,
}: RegisterDeviceDialogProps) {
	const mutation = useRegisterDevice();

	const form = useAppForm({
		...registerDeviceFormOptions,

		onSubmit: async ({ value }) => {
			const result = await mutation.mutateAsync({
				workspaceId,
				deviceData: {
					...value,
					clientId,
				},
				eden,
			});

			const device: DeviceListItem = {
				id: result.deviceId,
				clientId,
				serialNumber: value.serialNumber.trim(),
				brand: value.brand.trim(),
				model: value.model.trim(),
			};

			form.reset();
			onOpenChange(false);
			onRegistered?.(device);
		},
	});

	useEffect(() => {
		if (open) {
			form.setFieldValue("clientId", clientId);
			return;
		}

		form.reset();
	}, [open, clientId, form]);

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			form.reset();
			mutation.reset();
		}

		onOpenChange(nextOpen);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-2xl overflow-y-auto no-scrollbar max-h-137.5">
				<DialogHeader>
					<DialogTitle>Registrar dispositivo</DialogTitle>
					<DialogDescription>
						Registra el equipo que recibirá el servicio.
					</DialogDescription>
				</DialogHeader>

				{mutation.isError && (
					<Alert variant="destructive">
						<AlertCircle className="size-4" />
						<AlertDescription>
							No se pudo registrar el dispositivo. Intenta de nuevo.
						</AlertDescription>
					</Alert>
				)}

				<form
					noValidate
					className="space-y-4"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						void form.handleSubmit();
					}}
				>
					<FieldGroup className="gap-4">
						<FieldGroup className="grid gap-4 sm:grid-cols-2">
							<form.Field
								name="brand"
								validators={{ onChange: DeviceBrandSchema }}
							>
								{(field) => {
									const hasError = field.state.meta.errors.length > 0;

									return (
										<Field data-invalid={hasError}>
											<FieldLabel htmlFor={field.name}>Marca</FieldLabel>
											<FieldContent>
												<Input
													id={field.name}
													name={field.name}
													autoFocus
													placeholder="Ej. HP"
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(event) =>
														field.handleChange(event.target.value)
													}
													aria-invalid={hasError}
												/>
												<FieldError
													className="text-xs"
													errors={[field.state.meta.errors[0]]}
												/>
											</FieldContent>
										</Field>
									);
								}}
							</form.Field>

							<form.Field
								name="model"
								validators={{ onChange: DeviceModelSchema }}
							>
								{(field) => {
									const hasError = field.state.meta.errors.length > 0;

									return (
										<Field data-invalid={hasError}>
											<FieldLabel htmlFor={field.name}>Modelo</FieldLabel>
											<FieldContent>
												<Input
													id={field.name}
													name={field.name}
													placeholder="Ej. LaserJet Pro M404dn"
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(event) =>
														field.handleChange(event.target.value)
													}
													aria-invalid={hasError}
												/>
												<FieldError
													className="text-xs"
													errors={[field.state.meta.errors[0]]}
												/>
											</FieldContent>
										</Field>
									);
								}}
							</form.Field>
						</FieldGroup>

						<form.Field
							name="serialNumber"
							validators={{ onChange: DeviceSerialNumberSchema }}
						>
							{(field) => {
								const hasError = field.state.meta.errors.length > 0;

								return (
									<Field data-invalid={hasError}>
										<FieldLabel htmlFor={field.name}>
											Número de serie
										</FieldLabel>
										<FieldContent>
											<Input
												id={field.name}
												name={field.name}
												placeholder="Ej. CN12345678"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
												aria-invalid={hasError}
											/>
											<FieldError
												className="text-xs"
												errors={[field.state.meta.errors[0]]}
											/>
										</FieldContent>
									</Field>
								);
							}}
						</form.Field>

						<form.AppField name="components">
							{(field) => <field.DeviceComponentsField />}
						</form.AppField>
					</FieldGroup>

					<DialogFooter className="bg-transparent">
						<form.Subscribe selector={(state) => state.isSubmitting}>
							{(isSubmitting) => (
								<Button
									type="button"
									variant="secondary"
									disabled={isSubmitting}
									onClick={() => handleOpenChange(false)}
								>
									Cancelar
								</Button>
							)}
						</form.Subscribe>

						<form.Subscribe
							selector={(state) =>
								[state.canSubmit, state.isSubmitting] as const
							}
						>
							{([canSubmit, isSubmitting]) => (
								<Button type="submit" disabled={!canSubmit || isSubmitting}>
									{isSubmitting ? (
										<>
											<Loader2 className="size-4 animate-spin" />
											Guardando…
										</>
									) : (
										"Guardar dispositivo"
									)}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
