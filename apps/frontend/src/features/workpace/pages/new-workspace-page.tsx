/** biome-ignore-all lint/correctness/noChildrenProp: <> */
import { Link, useNavigate, useRouteContext } from "@tanstack/react-router";
import { cn } from "cn";
import { AlertCircle, ChevronRight, Loader2 } from "lucide-react";
import {
	AddressSchema,
	CompanyNameSchema,
	createWorkspaceFormOptions,
	useAppForm,
	useCreateWorkspace,
	WorkspaceNameSchema,
} from "@/features/workpace/create-workspace";
import { MinimalHeader } from "@/shared/components/minimal-header";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import {
	Field,
	FieldContent,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Separator } from "@/shared/components/ui/separator";
import { EmailSchema, PhoneSchema } from "@/shared/schemas";

export function NewWorkspacePage() {
	const { eden } = useRouteContext({ from: "/_authenticated" });
	const navigate = useNavigate();

	const createWorkspaceMutation = useCreateWorkspace();

	const form = useAppForm({
		...createWorkspaceFormOptions,

		onSubmit: async ({ value }) => {
			console.log(value);

			const workspace = await createWorkspaceMutation.mutateAsync({
				eden,
				workspaceData: value,
			});

			navigate({
				to: "/workspace/$workspaceId",
				params: {
					workspaceId: workspace.workspaceId,
				},
			});
		},
	});

	return (
		<div className="relative z-50 min-h-screen overflow-hidden bg-background font-body text-foreground antialiased">
			<div
				className="pointer-events-none absolute -left-28 -top-28 size-110 rounded-full bg-primary/15 blur-3xl"
				style={{ animation: "drift 18s cubic-bezier(0.32,0.72,0,1) infinite" }}
			/>
			<MinimalHeader />
			<main className="relative mx-auto max-w-xl px-4 py-10 sm:px-6">
				<form.Subscribe selector={(state) => state.isSubmitting}>
					{(isSubmitting) => (
						<Link
							to="/"
							className={cn(
								buttonVariants({ size: "sm", variant: "ghost" }),
								"mb-4",
							)}
							disabled={isSubmitting}
						>
							<ChevronRight className="size-3.5 rotate-180" /> Espacios de
							trabajo
						</Link>
					)}
				</form.Subscribe>
				<div
					className="glass-panel rounded-xl px-6 py-8"
					style={{ animation: "rise 600ms cubic-bezier(0.32,0.72,0,1) both" }}
				>
					<p className="font-mono text-[11px] uppercase tracking-widest text-primary">
						Acceso
					</p>
					<h1 className="mt-1 font-display text-2xl font-bold">
						Crear espacio de trabajo
					</h1>
					<p className="mt-1.5 text-sm text-muted-foreground">
						Configura tu empresa para comenzar.
					</p>

					{createWorkspaceMutation.isError && (
						<Alert variant="destructive" className="mt-4">
							<AlertCircle className="size-4" />
							<AlertDescription>
								No se pudo crear el espacio de trabajo. Intenta de nuevo.
							</AlertDescription>
						</Alert>
					)}

					<form
						className="mt-6 space-y-5"
						noValidate
						onSubmit={(event) => {
							event.preventDefault();
							event.stopPropagation();
							form.handleSubmit();
						}}
					>
						<FieldGroup>
							<form.Field
								name="workspaceName"
								validators={{ onChange: WorkspaceNameSchema }}
							>
								{(field) => {
									const hasError = field.state.meta.errors.length > 0;

									return (
										<Field data-invalid={hasError} orientation="vertical">
											<FieldLabel htmlFor={field.name}>
												Nombre del espacio
											</FieldLabel>
											<FieldContent>
												<Input
													id={field.name}
													name={field.name}
													placeholder="Ej. Acme Copier Services"
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
							<Separator />
							<form.Field
								name="companyDetails.name"
								validators={{ onChange: CompanyNameSchema }}
							>
								{(field) => {
									const hasError = field.state.meta.errors.length > 0;
									return (
										<Field data-invalid={hasError} orientation="vertical">
											<FieldLabel htmlFor={field.name}>
												Nombre de la empresa
											</FieldLabel>
											<FieldContent>
												<Input
													id={field.name}
													name={field.name}
													placeholder="Razón social o nombre comercial"
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(event) =>
														field.handleChange(event.target.value)
													}
													aria-invalid={hasError}
												/>
												<FieldError
													className="text-xs"
													errors={field.state.meta.errors}
												/>
											</FieldContent>
										</Field>
									);
								}}
							</form.Field>
							<FieldGroup className="grid gap-3 sm:grid-cols-2">
								<form.Field
									name="companyDetails.phone"
									validators={{ onChange: PhoneSchema }}
								>
									{(field) => {
										const hasError = field.state.meta.errors.length > 0;
										return (
											<Field data-invalid={hasError} orientation="vertical">
												<FieldLabel htmlFor={field.name}> Teléfono </FieldLabel>
												<FieldContent>
													<Input
														id={field.name}
														name={field.name}
														placeholder="55 1234 5678"
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
									name="companyDetails.email"
									validators={{ onChange: EmailSchema }}
								>
									{(field) => {
										const hasError = field.state.meta.errors.length > 0;
										return (
											<Field data-invalid={hasError} orientation="vertical">
												<FieldLabel htmlFor={field.name}>
													Correo electrónico
												</FieldLabel>
												<FieldContent>
													<Input
														id={field.name}
														name={field.name}
														type="email"
														placeholder="contacto@empresa.mx"
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(event) =>
															field.handleChange(event.target.value)
														}
														aria-invalid={hasError}
													/>
													<FieldError
														className="text-xs"
														errors={field.state.meta.errors}
													/>
												</FieldContent>
											</Field>
										);
									}}
								</form.Field>
							</FieldGroup>
							<form.Field
								name="companyDetails.address"
								validators={{ onChange: AddressSchema }}
							>
								{(field) => {
									const hasError = field.state.meta.errors.length > 0;
									return (
										<Field data-invalid={hasError} orientation="vertical">
											<FieldLabel htmlFor={field.name}> Dirección </FieldLabel>
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
													errors={field.state.meta.errors}
												/>
											</FieldContent>
										</Field>
									);
								}}
							</form.Field>
						</FieldGroup>

						<form.AppField name="logoFile">
							{(field) => <field.LogoUploadField />}
						</form.AppField>

						<div className="flex justify-end gap-3 pt-2">
							<form.Subscribe selector={(state) => state.isSubmitting}>
								{(isSubmitting) => (
									<Link
										to="/"
										className={cn(buttonVariants({ variant: "outline" }))}
										disabled={isSubmitting}
									>
										Cancelar
									</Link>
								)}
							</form.Subscribe>
							<form.Subscribe
								selector={(state) => [state.canSubmit, state.isSubmitting]}
							>
								{([canSubmit, isSubmitting]) => (
									<Button type="submit" disabled={!canSubmit}>
										{isSubmitting ? (
											<>
												<Loader2 className="mr-2 size-4 animate-spin" />
												Creando…
											</>
										) : (
											"Crear espacio de trabajo"
										)}
									</Button>
								)}
							</form.Subscribe>
						</div>
					</form>
				</div>
			</main>
		</div>
	);
}
