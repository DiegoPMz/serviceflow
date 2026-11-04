import { useSelector } from "@tanstack/react-form";
import { SquareDashedMousePointerIcon } from "lucide-react";
import { useState } from "react";
import type { ClientListItem } from "@/features/client/paginated-clients";
import { RegisterClientDialog } from "@/features/client/register-client";
import type { DeviceListItem } from "@/features/device/paginated-devices";
import { RegisterDeviceDialog } from "@/features/device/register-device";
import {
	createOrderDefaultValues,
	withForm,
} from "@/features/order/create-order";
import { IconContainer } from "@/shared/components/icon-container";
import {
	Field,
	FieldContent,
	FieldGroup,
	FieldLabel,
} from "@/shared/components/ui/field";
import type { Eden } from "@/shared/http/client";
import { BentoSection } from "../bento-section";
import { ClientsComboBox } from "./client-combo-box";
import { ClientSummary } from "./client-summary";
import { DevicesComboBox } from "./device-combo-box";
import { DeviceSummary } from "./device-summary";
import { EmptySelectionPrompt } from "./empty-selection-prompt";

type ClientAndDeviceSectionProps = {
	workspaceId: string;
	eden: Eden;
	onCreateClient?: () => void;
	onCreateDevice?: (clientId: string) => void;
};

export const ClientAndDeviceSection = withForm({
	defaultValues: createOrderDefaultValues,
	props: {} as ClientAndDeviceSectionProps,
	render: ({ form, workspaceId, eden, onCreateClient, onCreateDevice }) => {
		const clientId = useSelector(form.store, (state) => state.values.clientId);
		const deviceId = useSelector(form.store, (state) => state.values.deviceId);

		const [clientsById, setClientsById] = useState<
			Record<string, ClientListItem>
		>({});
		const [devicesById, setDevicesById] = useState<
			Record<string, DeviceListItem>
		>({});

		const selectedClient = clientsById[clientId] ?? null;
		const selectedDevice = devicesById[deviceId] ?? null;

		const [showClientDialog, setShowClientDialog] = useState(false);
		const [showDeviceDialog, setShowDeviceDialog] = useState(false);

		function handleSelectClient(client: ClientListItem | null) {
			form.setFieldValue("clientId", client?.id ?? "");
			form.setFieldValue("deviceId", "");
			form.setFieldValue("components", []);
			form.setFieldValue("photoFile", null);
			form.setFieldValue("signatureDataUrl", null);

			if (client) {
				setClientsById((current) => ({
					...current,
					[client.id]: client,
				}));
			}
		}

		function handleSelectDevice(device: DeviceListItem | null) {
			form.setFieldValue("deviceId", device?.id ?? "");
			form.setFieldValue("photoFile", null);
			form.setFieldValue("signatureDataUrl", null);

			if (device) {
				setDevicesById((current) => ({
					...current,
					[device.id]: device,
				}));
			}
		}

		return (
			<>
				<BentoSection
					number="01"
					title="Cliente y dispositivo"
					description="Selecciona al cliente y el equipo que recibirá el servicio."
					className="animate-rise"
				>
					<FieldGroup className="grid sm:grid-cols-2 xl:grid-cols-1">
						<form.Field
							name="clientId"
							validators={{
								onSubmit: ({ value }) =>
									value ? undefined : "Selecciona un cliente.",
							}}
						>
							{() => (
								<Field className="min-w-0 sm:col-span-1">
									<FieldLabel>Cliente</FieldLabel>

									<FieldContent className="space-y-2">
										<ClientsComboBox
											eden={eden}
											workspaceId={workspaceId}
											selectedClient={selectedClient}
											onSelect={handleSelectClient}
											onCreateClient={() => {
												setShowClientDialog(true);
												onCreateClient?.();
											}}
										/>

										{selectedClient ? (
											<ClientSummary client={selectedClient} />
										) : (
											<EmptySelectionPrompt
												title="Ningún cliente seleccionado"
												description="Busca un cliente existente en el selector o registra uno nuevo para continuar."
											/>
										)}
									</FieldContent>
								</Field>
							)}
						</form.Field>

						<form.Field
							name="deviceId"
							validators={{
								onSubmit: ({ value }) =>
									value ? undefined : "Selecciona un dispositivo.",
							}}
						>
							{() => (
								<Field className="min-w-0 sm:col-span-1">
									<FieldLabel>Dispositivo</FieldLabel>

									<div className="space-y-2">
										{clientId ? (
											<DevicesComboBox
												key={clientId}
												eden={eden}
												workspaceId={workspaceId}
												clientId={clientId}
												selectedDevice={selectedDevice}
												onSelect={handleSelectDevice}
												onCreateDevice={() => {
													setShowDeviceDialog(true);
													onCreateDevice?.(clientId);
												}}
											/>
										) : (
											<div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-muted/10 p-3">
												<IconContainer
													className="size-9"
													icon={SquareDashedMousePointerIcon}
												/>

												<div className="min-w-0 space-y-1 pt-0.5">
													<p className="text-sm font-medium">
														Selecciona un cliente
													</p>

													<p className="text-xs leading-relaxed text-muted-foreground">
														Los dispositivos disponibles dependen del cliente
														elegido.
													</p>
												</div>
											</div>
										)}

										{clientId &&
											(selectedDevice ? (
												<DeviceSummary device={selectedDevice} />
											) : (
												<EmptySelectionPrompt
													title="Ningún dispositivo seleccionado"
													description="Busca un dispositivo existente o registra uno nuevo para asociarlo a esta orden de servicio."
												/>
											))}
									</div>
								</Field>
							)}
						</form.Field>
					</FieldGroup>
				</BentoSection>

				<RegisterClientDialog
					eden={eden}
					workspaceId={workspaceId}
					open={showClientDialog}
					onOpenChange={setShowClientDialog}
					onRegistered={handleSelectClient}
				/>

				{clientId && (
					<RegisterDeviceDialog
						eden={eden}
						workspaceId={workspaceId}
						clientId={clientId}
						open={showDeviceDialog}
						onOpenChange={setShowDeviceDialog}
						onRegistered={handleSelectDevice}
					/>
				)}
			</>
		);
	},
});
