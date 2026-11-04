import { useSelector } from "@tanstack/react-form";
import {
	createOrderDefaultValues,
	OrderPhotoFileSchema,
	OrderSignatureDataUrlSchema,
	withForm,
} from "@/features/order/create-order";
import { FieldGroup } from "@/shared/components/ui/field";
import { BentoSection } from "../bento-section";
import { LockedPrompt } from "../locked-prompt";

type EvidencesSectionProps = Record<never, never>;

export const EvidencesSection = withForm({
	defaultValues: createOrderDefaultValues,
	props: {} as EvidencesSectionProps,

	render: ({ form }) => {
		const deviceId = useSelector(form.store, (state) => state.values.deviceId);

		const isReady = Boolean(deviceId);

		return (
			<BentoSection
				number="04"
				title="Evidencia y conformidad"
				description="Adjunta una fotografía del equipo y registra la firma del cliente."
				className="animate-rise"
			>
				{isReady ? (
					<FieldGroup className="grid gap-5 sm:grid-cols-2 fit">
						<form.AppField
							name="photoFile"
							validators={{ onSubmit: OrderPhotoFileSchema }}
						>
							{(field) => <field.PhotoCaptureField />}
						</form.AppField>

						<form.AppField
							name="signatureDataUrl"
							validators={{ onSubmit: OrderSignatureDataUrlSchema }}
						>
							{(field) => <field.SignatureCaptureField />}
						</form.AppField>
					</FieldGroup>
				) : (
					<LockedPrompt
						message={
							deviceId
								? "Completa el tipo de servicio y la descripción del problema para agregar la evidencia."
								: "Selecciona un dispositivo para agregar la evidencia."
						}
					/>
				)}
			</BentoSection>
		);
	},
});
