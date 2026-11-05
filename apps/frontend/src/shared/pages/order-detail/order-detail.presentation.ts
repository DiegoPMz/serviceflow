import type {
	OrderServiceType,
	OrderSupply,
} from "@/features/order/order-details";

const SERVICE_TYPE_LABELS: Record<OrderServiceType, string> = {
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

export function getInitials(name: string): string {
	const words = name.trim().split(/\s+/).filter(Boolean);

	return (
		words
			.slice(0, 2)
			.map((word) => word[0])
			.join("")
			.toUpperCase() || "U"
	);
}
