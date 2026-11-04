import type { OrderServiceType } from "./create-order.schema";

export const SERVICE_TYPES = [
	{
		value: "preventive_maintenance",
		label: "Mantenimiento preventivo",
	},
	{
		value: "corrective_maintenance",
		label: "Reparación",
	},
	{
		value: "diagnostics",
		label: "Diagnóstico",
	},
	{
		value: "installation",
		label: "Instalación y configuración",
	},
	{
		value: "other",
		label: "Otro",
	},
] as const satisfies readonly { value: OrderServiceType; label: string }[];
