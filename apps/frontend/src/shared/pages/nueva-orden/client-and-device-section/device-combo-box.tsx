import { Monitor, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import type { DeviceListItem } from "@/features/device/paginated-devices";
import { useGetPaginatedDevices } from "@/features/device/paginated-devices";
import { ComboboxStatus } from "@/shared/components/combobox-status";
import { Button } from "@/shared/components/ui/button";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/shared/components/ui/combobox";
import type { Eden } from "@/shared/http/client";
import { useDebouncedValue } from "@/shared/lib/use-debounced-value";
import { deviceLabel } from "./device-label";

type DevicesComboBoxProps = {
	eden: Eden;
	workspaceId: string;
	clientId: string;
	selectedDevice: DeviceListItem | null;
	onSelect: (device: DeviceListItem | null) => void;
	onCreateDevice?: () => void;
};

const RESULTS_LIMIT = 4;
const SEARCH_DEBOUNCE_MS = 400;

export function DevicesComboBox({
	eden,
	workspaceId,
	clientId,
	selectedDevice,
	onSelect,
	onCreateDevice,
}: DevicesComboBoxProps) {
	const [search, setSearch] = useState("");
	const [inputValue, setInputValue] = useState(
		selectedDevice ? deviceLabel(selectedDevice) : "",
	);
	const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

	useEffect(() => {
		setInputValue(selectedDevice ? deviceLabel(selectedDevice) : "");
	}, [selectedDevice]);

	const { data, isPending, isError, isFetching, refetch } =
		useGetPaginatedDevices(eden, {
			workspaceId,
			limit: RESULTS_LIMIT,
			orderBy: "brand",
			direction: "asc",
			clientId,
			search: debouncedSearch.trim() || undefined,
		});

	const devices = data?.pages[0]?.items ?? [];
	const hasMore = data?.pages[0]?.hasNextPage ?? false;

	return (
		<Combobox
			items={devices}
			filter={null}
			value={selectedDevice}
			isItemEqualToValue={(item: DeviceListItem, value: DeviceListItem) =>
				item.id === value.id
			}
			itemToStringLabel={deviceLabel}
			itemToStringValue={(device: DeviceListItem) => device.id}
			inputValue={inputValue}
			onInputValueChange={(value, { reason }) => {
				setInputValue(value);

				if (reason === "input-change") {
					setSearch(value);
				} else if (reason === "input-clear") {
					setSearch("");
				}
			}}
			onValueChange={(device) => {
				setSearch("");
				onSelect(device ?? null);
			}}
		>
			<ComboboxInput
				placeholder="Buscar dispositivo por marca, modelo o serie..."
				className="w-full"
				showClear
			/>

			<ComboboxContent>
				<ComboboxEmpty>
					{isError
						? "No pudimos cargar los dispositivos."
						: isPending
							? "Buscando dispositivos…"
							: "No se encontraron dispositivos."}
				</ComboboxEmpty>

				<ComboboxList>
					{(device: DeviceListItem) => (
						<ComboboxItem key={device.id} value={device}>
							<div className="flex min-w-0 items-start gap-2">
								<Monitor className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

								<div className="flex min-w-0 flex-col gap-0.5">
									<span className="truncate text-sm font-medium">
										{deviceLabel(device)}
									</span>

									<span className="truncate text-xs text-muted-foreground">
										Serie: {device.serialNumber || "Sin número de serie"}
									</span>
								</div>
							</div>
						</ComboboxItem>
					)}
				</ComboboxList>

				<ComboboxStatus
					isError={isError}
					isFetching={isFetching}
					isPending={isPending}
					hasMore={hasMore}
					onRetry={() => void refetch()}
					hasMoreMessage="Hay más coincidencias. Escribe para afinar la búsqueda."
				/>

				{onCreateDevice && (
					<div className="border-t border-border/70 p-1">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="w-full justify-start"
							onClick={onCreateDevice}
						>
							<Plus className="size-4" />
							Registrar dispositivo
						</Button>
					</div>
				)}
			</ComboboxContent>
		</Combobox>
	);
}
