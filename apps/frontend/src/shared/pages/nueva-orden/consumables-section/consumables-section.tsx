import { useSelector } from "@tanstack/react-form";
import { cn } from "cn";
import { ChevronDown, Package } from "lucide-react";
import { useState } from "react";
import type { DeviceComponentListItem } from "@/features/device/paginated-device-components";
import {
	createOrderDefaultValues,
	withForm,
} from "@/features/order/create-order";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
import { Field, FieldGroup, FieldLabel } from "@/shared/components/ui/field";
import type { Eden } from "@/shared/http/client";
import { BentoSection } from "../bento-section";
import { LockedPrompt } from "../locked-prompt";
import { ConsumableCard } from "./consumable-card";
import { ConsumablesComboBox } from "./consumables-combo-box";

type ConsumablesSectionProps = {
	workspaceId: string;
	eden: Eden;
};

export const ConsumablesSection = withForm({
	defaultValues: createOrderDefaultValues,
	props: {} as ConsumablesSectionProps,

	render: ({ form, eden, workspaceId }) => {
		const deviceId = useSelector(form.store, (state) => state.values.deviceId);
		const selectedComponents = useSelector(
			form.store,
			(state) => state.values.components,
		);

		const [componentsById, setComponentsById] = useState<
			Record<string, DeviceComponentListItem>
		>({});
		const [consumablesOpen, setConsumablesOpen] = useState(false);
		const [knownDeviceId, setKnownDeviceId] = useState(deviceId);

		// Al cambiar de dispositivo el formulario limpia sus componentes; aquí se
		// descarta también la información de apoyo usada para renderizarlos.
		if (knownDeviceId !== deviceId) {
			setKnownDeviceId(deviceId);
			setComponentsById({});
			setConsumablesOpen(false);
		}

		function addComponent(component: DeviceComponentListItem) {
			if (selectedComponents.some((item) => item.id === component.id)) {
				return;
			}

			setComponentsById((current) => ({
				...current,
				[component.id]: component,
			}));

			form.setFieldValue("components", [
				...selectedComponents,
				{ id: component.id, quantity: 1 },
			]);

			setConsumablesOpen(true);
		}

		function updateQuantity(id: string, quantity: number) {
			form.setFieldValue(
				"components",
				selectedComponents.map((item) =>
					item.id === id ? { ...item, quantity } : item,
				),
			);
		}

		function removeComponent(id: string) {
			const next = selectedComponents.filter((item) => item.id !== id);

			form.setFieldValue("components", next);

			if (next.length === 0) {
				setConsumablesOpen(false);
			}
		}

		const totalUnits = selectedComponents.reduce(
			(total, item) => total + item.quantity,
			0,
		);

		return (
			<BentoSection
				number="03"
				title="Consumibles y componentes"
				description="Materiales utilizados durante el servicio. Esta sección es opcional."
				className="animate-rise"
				action={
					<Badge
						variant={"outline"}
						className="text-[10px] font-medium text-muted-foreground"
					>
						Opcional
					</Badge>
				}
			>
				{deviceId ? (
					<FieldGroup>
						<Field className="min-w-0">
							<FieldLabel>Consumibles y componentes</FieldLabel>

							<ConsumablesComboBox
								eden={eden}
								workspaceId={workspaceId}
								deviceId={deviceId}
								selectedIds={selectedComponents.map((item) => item.id)}
								onSelect={addComponent}
							/>
						</Field>

						{selectedComponents.length === 0 ? (
							/* Estado vacío */
							<div className="bg-muted/70 rounded-xl p-4 border border-border">
								<p className="text-sm font-medium">Sin consumibles agregados</p>

								<p className="mt-1 text-xs text-muted-foreground">
									Puedes omitir esta sección si no se utilizaron materiales.
								</p>
							</div>
						) : (
							/* Lista desplegable */
							<Collapsible
								open={consumablesOpen}
								onOpenChange={setConsumablesOpen}
								className="overflow-hidden rounded-xl border border-border/60 bg-muted/70 "
							>
								{/* Resumen siempre visible */}
								<CollapsibleTrigger
									type="button"
									render={
										<Button
											variant={"ghost"}
											className="flex w-full h-fit items-center justify-between gap-3 p-3 text-left"
										/>
									}
								>
									<span className="flex min-w-0 items-center gap-3">
										<div className="p-1 shrink-0 bg-primary text-primary-foreground rounded-sm">
											<Package className="size-5" />
										</div>

										<span className="min-w-0 space-y-1">
											<span className="block text-sm font-medium">
												{selectedComponents.length}{" "}
												{selectedComponents.length === 1
													? "consumible agregado"
													: "consumibles agregados"}
											</span>

											<span className="block text-xs text-muted-foreground">
												{totalUnits}{" "}
												{totalUnits === 1
													? "unidad en total"
													: "unidades en total"}
											</span>
										</span>
									</span>

									<ChevronDown
										className={cn(
											"size-4 shrink-0 text-muted-foreground transition-transform duration-200",
											consumablesOpen && "rotate-180",
										)}
									/>
								</CollapsibleTrigger>

								{/* Detalles que pueden crecer */}
								<CollapsibleContent
									keepMounted
									className="border-t border-border"
								>
									<div className="space-y-2">
										{selectedComponents.map((item) => (
											<ConsumableCard
												key={item.id}
												id={item.id}
												quantity={item.quantity}
												component={componentsById[item.id]}
												onQuantityChange={(quantity) =>
													updateQuantity(item.id, quantity)
												}
												onRemove={() => removeComponent(item.id)}
											/>
										))}
									</div>
								</CollapsibleContent>
							</Collapsible>
						)}
					</FieldGroup>
				) : (
					<LockedPrompt message="Selecciona un cliente y un dispositivo para agregar consumibles." />
				)}
			</BentoSection>
		);
	},
});
