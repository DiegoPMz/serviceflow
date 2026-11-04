import { Hash, Printer } from "lucide-react";
import type { DeviceListItem } from "@/features/device/paginated-devices";
import { deviceLabel } from "./device-label";

export function DeviceSummary({ device }: { device: DeviceListItem }) {
	return (
		<div className="rounded-xl border border-border/70 bg-card p-3">
			<div className="flex min-w-0 items-center gap-3">
				<div className="p-1 shrink-0 bg-primary text-primary-foreground rounded-sm">
					<Printer className="size-5" />
				</div>

				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-medium">{deviceLabel(device)}</p>
					<p className="text-xs text-muted-foreground">
						Dispositivo seleccionado
					</p>
				</div>
			</div>

			<div className="mt-3 border-t border-border pt-3">
				<div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
					<Hash className="size-3.5 shrink-0" />
					<span className="shrink-0">Número de serie:</span>
					<span className="truncate font-medium text-foreground">
						{device.serialNumber || "Sin número de serie"}
					</span>
				</div>
			</div>
		</div>
	);
}
