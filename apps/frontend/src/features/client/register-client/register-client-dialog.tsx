import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect } from "react";
import type { ClientListItem } from "@/features/client/paginated-clients";
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
import { EmailSchema, PhoneSchema } from "@/shared/schemas";
import { registerClientFormOptions, useAppForm } from "./register-client.form";
import { useRegisterClient } from "./register-client.mutation";
import {
	ClientLocationSchema,
	ClientNameSchema,
} from "./register-client.schema";

export interface RegisterClientDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	workspaceId: string;
	eden: Eden;
	onRegistered?: (client: ClientListItem) => void;
}

export function RegisterClientDialog({
	open,
	onOpenChange,
	workspaceId,
	eden,
	onRegistered,
}: RegisterClientDialogProps) {
	const mutation = useRegisterClient();

	const form = useAppForm({
		...registerClientFormOptions,

		onSubmit: async ({ value }) => {
			const result = await mutation.mutateAsync({
				workspaceId,
				clientData: value,
				eden,
			});

			const client: ClientListItem = {
				id: result.clientId,
				name: value.name.trim(),
				email: value.email.trim(),
				phoneNumber: value.phoneNumber.trim(),
				location: value.location.trim(),
				ordersCount: 0,
				lastOrder: null,
			};

			form.reset();
			onOpenChange(false);
			onRegistered?.(client);
		},
	});

	useEffect(() => {
		if (!open) form.reset();
	}, [open, form]);

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			form.reset();
			mutation.reset();
		}

		onOpenChange(nextOpen);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Registrar cliente</DialogTitle>
					<DialogDescription>
						Agrega los datos básicos del cliente.
					</DialogDescription>
				</DialogHeader>

				{mutation.isError && (
					<Alert variant="destructive">
						<AlertCircle className="size-4" />
						<AlertDescription>
							No se pudo registrar el cliente. Intenta de nuevo.
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
						<form.Field name="name" validators={{ onChange: ClientNameSchema }}>
							{(field) => {
								const hasError = field.state.meta.errors.length > 0;

								return (
									<Field data-invalid={hasError}>
										<FieldLabel htmlFor={field.name}>
											Nombre completo / Razón social
										</FieldLabel>
										<FieldContent>
											<Input
												id={field.name}
												name={field.name}
												autoFocus
												placeholder="Ej. Juan Pérez"
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
							name="phoneNumber"
							validators={{ onChange: PhoneSchema }}
						>
							{(field) => {
								const hasError = field.state.meta.errors.length > 0;

								return (
									<Field data-invalid={hasError}>
										<FieldLabel htmlFor={field.name}>Teléfono</FieldLabel>
										<FieldContent>
											<Input
												id={field.name}
												name={field.name}
												type="tel"
												inputMode="tel"
												placeholder="Ej. 55 1234 5678"
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

						<form.Field name="email" validators={{ onChange: EmailSchema }}>
							{(field) => {
								const hasError = field.state.meta.errors.length > 0;

								return (
									<Field data-invalid={hasError}>
										<FieldLabel htmlFor={field.name}>
											Correo electrónico
										</FieldLabel>
										<FieldContent>
											<Input
												id={field.name}
												name={field.name}
												type="email"
												placeholder="cliente@empresa.com"
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
							name="location"
							validators={{ onChange: ClientLocationSchema }}
						>
							{(field) => {
								const hasError = field.state.meta.errors.length > 0;

								return (
									<Field data-invalid={hasError}>
										<FieldLabel htmlFor={field.name}>Dirección</FieldLabel>
										<FieldContent>
											<Input
												id={field.name}
												name={field.name}
												placeholder="Calle, número, colonia, ciudad"
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
										"Guardar cliente"
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
