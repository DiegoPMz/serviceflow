import type {
	OrderServiceType,
	OrderSupply,
} from "@/features/order/order-details";

export const SERVICE_TYPE_LABELS: Record<OrderServiceType, string> = {
	preventive_maintenance: "Mantenimiento preventivo",
	corrective_maintenance: "Reparación",
	diagnostics: "Diagnóstico",
	installation: "Instalación y configuración",
	other: "Otro",
};

const SUPPLY_TYPE_LABELS: Record<OrderSupply["type"], string> = {
	supply: "Insumo",
	replacement_part: "Refacción",
	other: "Otro",
};

export function getServiceTypeLabel(value: OrderServiceType): string {
	return SERVICE_TYPE_LABELS[value] ?? "Tipo de servicio desconocido";
}

export function getSupplyTypeLabel(type: OrderSupply["type"]): string {
	return SUPPLY_TYPE_LABELS[type] ?? "Otro";
}
