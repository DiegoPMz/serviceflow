import { ORDER_STATUS_PRESENTATION } from "@/features/order/common/order-status.presentation";
import type { OrderDetails } from "@/features/order/order-details";
import { formatRelativeTime } from "@/shared/lib/format-relative-time";
import {
	getServiceTypeLabel,
	getSupplyTypeLabel,
} from "./order-detail.presentation";

export function getOrderSummaryCopyText(order: OrderDetails): string {
	return [
		`Orden: ${order.folio}`,
		`Estado: ${ORDER_STATUS_PRESENTATION[order.status].label}`,
		`Tipo de servicio: ${getServiceTypeLabel(order.serviceType)}`,
		`Fecha de creación: ${formatRelativeTime(order.createdAt).label}`,
		`Última actualización: ${formatRelativeTime(order.updatedAt).label}`,
		`Creada por: ${order.technician.name}`,
	].join("\n");
}

export function getOrderClientCopyText(client: OrderDetails["client"]): string {
	return [
		`Cliente: ${client.name}`,
		`Teléfono: ${client.phone || "Sin teléfono"}`,
		`Correo: ${client.email || "Sin correo"}`,
		`Ubicación: ${client.location || "Sin ubicación"}`,
	].join("\n");
}

export function getOrderDeviceCopyText(device: OrderDetails["device"]): string {
	return [
		`Equipo: ${device.fullName || "Sin equipo"}`,
		`Número de serie: ${device.serialNumber || "Sin número de serie"}`,
	].join("\n");
}

export function getOrderObservationsCopyText(observations: string): string {
	return observations.trim() ? observations : "Sin observaciones";
}

export function getOrderSuppliesCopyText(
	supplies: OrderDetails["supplies"],
): string {
	if (supplies.length === 0) {
		return "Sin insumos registrados";
	}

	return supplies
		.map(
			(supply) =>
				`${supply.name} (${supply.quantity} ${
					supply.quantity === 1 ? "unidad" : "unidades"
				}${supply.partNumber ? `, ${supply.partNumber}` : ""}, ${getSupplyTypeLabel(
					supply.type,
				)})`,
		)
		.join("\n");
}
