import type { DeviceComponentType } from "@/features/device/paginated-device-components";

export const COMPONENT_TYPE_LABELS: Record<DeviceComponentType, string> = {
	supply: "Consumible",
	replacement_part: "Repuesto",
	other: "Otro",
};

export const COMPONENT_BADGE_CLASSES: Record<DeviceComponentType, string> = {
	supply: "border-cyan-500 text-cyan-900 dark:text-cyan-600",
	replacement_part: "border-orange-500 text-orange-700 dark:text-orange-600",
	other: "border-slate-400 text-slate-600 dark:text-slate-300",
};
