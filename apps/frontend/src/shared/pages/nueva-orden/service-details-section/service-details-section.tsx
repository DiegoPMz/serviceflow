import { useSelector } from "@tanstack/react-form";
import {
	createOrderDefaultValues,
	OrderObservationsSchema,
	type OrderServiceType,
	OrderServiceTypeSchema,
	SERVICE_TYPES,
	withForm,
} from "@/features/order/create-order";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/shared/components/ui/field";
import { Textarea } from "@/shared/components/ui/textarea";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@/shared/components/ui/toggle-group";
import { BentoSection } from "../bento-section";
import { LockedPrompt } from "../locked-prompt";

type ServiceDetailsSectionProps = Record<never, never>;

export const ServiceDetailsSection = withForm({
	defaultValues: createOrderDefaultValues,
	props: {} as ServiceDetailsSectionProps,
	render: ({ form }) => {
		const deviceId = useSelector(form.store, (state) => state.values.deviceId);

		return (
			<BentoSection
				number="02"
				title="Servicio"
				description="Define la intervención y describe el problema reportado."
				className="animate-rise"
			>
				{deviceId ? (
					<FieldGroup className="space-y-5">
						<form.Field
							name="serviceType"
							validators={{ onSubmit: OrderServiceTypeSchema }}
						>
							{(field) => (
								<Field>
									<FieldLabel>Tipo de servicio</FieldLabel>

									<ToggleGroup
										orientation="vertical"
										value={field.state.value ? [field.state.value] : []}
										onValueChange={(value) =>
											field.handleChange((value[0] ?? "") as OrderServiceType)
										}
										variant="outline"
										spacing={2}
										size="lg"
									>
										{SERVICE_TYPES.map((serviceType) => (
											<ToggleGroupItem
												className="cursor-pointer"
												key={serviceType.value}
												value={serviceType.value}
												aria-label={serviceType.label}
											>
												{serviceType.label}
											</ToggleGroupItem>
										))}
									</ToggleGroup>

									<FieldError
										className="text-xs"
										errors={[field.state.meta.errors[0]]}
									/>
								</Field>
							)}
						</form.Field>

						<form.Field
							name="observations"
							validators={{
								onSubmit: OrderObservationsSchema,
							}}
						>
							{(field) => (
								<Field>
									<div className="space-y-2">
										<FieldLabel htmlFor="order-problem">
											Descripción del problema
										</FieldLabel>

										<Textarea
											id="order-problem"
											rows={5}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											placeholder="Ej. Atascos frecuentes en la bandeja 2 y código de error E000…"
											aria-invalid={field.state.meta.errors.length > 0}
											className="h-32 min-h-32 max-h-32 resize-none bg-muted/70  placeholder:text-sm"
										/>

										<div className="flex items-center justify-between gap-3">
											<p className="text-[11px] leading-5 text-muted-foreground">
												Incluye síntomas y detalles útiles para los técnicos.
											</p>
										</div>

										<FieldError
											className="text-xs"
											errors={[field.state.meta.errors[0]]}
										/>
									</div>
								</Field>
							)}
						</form.Field>
					</FieldGroup>
				) : (
					<LockedPrompt message="Selecciona un cliente y un dispositivo para continuar." />
				)}
			</BentoSection>
		);
	},
});
