import type { DeviceListItem } from "@/features/device/paginated-devices";

export function deviceLabel(device: DeviceListItem) {
	return `${device.brand} ${device.model}`.trim();
}
