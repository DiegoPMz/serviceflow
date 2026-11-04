import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
	createOrderFormOptions,
	useAppForm,
	useCreateOrder,
} from "@/features/order/create-order";
import { useGenerateOrderDocument } from "@/features/order/generate-order-document";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { ApiError } from "@/shared/lib/api-error";
import { fileToDataUrl } from "@/shared/lib/file-to-data-url";
import { ClientAndDeviceSection } from "@/shared/pages/nueva-orden/client-and-device-section";
import { ConsumablesSection } from "@/shared/pages/nueva-orden/consumables-section";
import { EvidencesSection } from "@/shared/pages/nueva-orden/evidences-section";
import { ServiceDetailsSection } from "@/shared/pages/nueva-orden/service-details-section";

export const Route = createFileRoute(
	"/_authenticated/workspace/$workspaceId/orden/nueva",
)({
	component: RouteComponent,
});

function RouteComponent() {
	const { eden } = Route.useRouteContext();
	const { workspaceId } = Route.useParams();

	const navigate = useNavigate();
	const createOrderMutation = useCreateOrder();
	const generateDocumentMutation = useGenerateOrderDocument();

	const form = useAppForm({
		...createOrderFormOptions,
		onSubmit: async ({ value, formApi }) => {
			const { photoFile, signatureDataUrl } = value;

			if (!photoFile || !signatureDataUrl) return;

			let deviceImageBase64: string;

			try {
				deviceImageBase64 = await fileToDataUrl(photoFile);
			} catch {
				formApi.setFieldMeta("photoFile", (prev) => ({
					...prev,
					errorMap: {
						...prev.errorMap,
						onSubmit:
							"No se pudo leer la fotografía. Intenta seleccionarla de nuevo.",
					},
				}));

				return;
			}

			let orderId: string;

			try {
				const result = await createOrderMutation.mutateAsync({
					workspaceId,
					eden,
					orderData: {
						clientId: value.clientId,
						deviceId: value.deviceId,
						serviceType: value.serviceType,
						observations: value.observations,
						components: value.components,
					},
				});

				orderId = result.orderId;
			} catch {
				return;
			}

			let documentFailed = false;

			try {
				await generateDocumentMutation.mutateAsync({
					workspaceId,
					orderId,
					deviceImageBase64,
					clientSignatureBase64: signatureDataUrl,
					eden,
				});
			} catch {
				documentFailed = true;
			}

			form.reset();

			navigate({
				to: "/workspace/$workspaceId/orden/$orderId",
				params: { workspaceId, orderId },
			});

			if (documentFailed) {
				toast.warning(
					"La orden se creó, pero la evidencia no pudo adjuntarse.",
				);
			}
		},
	});

	const createOrderError =
		createOrderMutation.error instanceof ApiError
			? createOrderMutation.error.message
			: "No se pudo crear la orden. Intenta de nuevo.";

	return (
		<main className="px-4 py-6 sm:px-6 lg:px-8 relative">
			<header className="mb-6 flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="text-[11px] uppercase tracking-widest text-primary">
						Captura de servicio
					</p>

					<h2 className="mt-1 text-3xl font-bold lg:text-4xl">
						Orden de servicio
					</h2>
				</div>
			</header>

			<form
				className="grid grid-cols-1 gap-6 xl:grid-cols-2"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				{createOrderMutation.error && (
					<Alert variant="destructive" className="xl:col-span-2">
						<AlertCircle className="size-4" />
						<AlertDescription>{createOrderError}</AlertDescription>
					</Alert>
				)}

				<ClientAndDeviceSection
					form={form}
					eden={eden}
					workspaceId={workspaceId}
				/>
				<ServiceDetailsSection form={form} />
				<ConsumablesSection form={form} eden={eden} workspaceId={workspaceId} />
				<EvidencesSection form={form} />

				<div className="xl:col-span-2 lg:flex lg:justify-center">
					<form.Subscribe
						selector={(state) =>
							[
								state.canSubmit,
								state.isSubmitting,
								Boolean(state.values.clientId && state.values.deviceId),
							] as const
						}
					>
						{([canSubmit, isSubmitting, hasRequireData]) => {
							return (
								<Button
									type="submit"
									size="lg"
									className="w-full lg:w-[70%]"
									disabled={!canSubmit || isSubmitting || !hasRequireData}
								>
									{isSubmitting ? (
										<>
											<Loader2 className="animate-spin" />
											Creando orden…
										</>
									) : (
										<>
											<CheckCircle2 />
											Crear orden
										</>
									)}
								</Button>
							);
						}}
					</form.Subscribe>
				</div>
			</form>
		</main>
	);
}
