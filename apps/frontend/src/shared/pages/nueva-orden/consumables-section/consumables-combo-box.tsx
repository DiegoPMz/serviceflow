import { Hash, Package } from "lucide-react";
import { useState } from "react";
import type { DeviceComponentListItem } from "@/features/device/paginated-device-components";
import { useGetPaginatedDeviceComponents } from "@/features/device/paginated-device-components";
import { ComboboxStatus } from "@/shared/components/combobox-status";
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
import { COMPONENT_TYPE_LABELS } from "./consumables.presentation";

const RESULTS_LIMIT = 4;
const SEARCH_DEBOUNCE_MS = 400;

type ConsumablesComboBoxProps = {
	eden: Eden;
	workspaceId: string;
	deviceId: string;
	selectedIds: string[];
	onSelect: (component: DeviceComponentListItem) => void;
};

export function ConsumablesComboBox({
	eden,
	workspaceId,
	deviceId,
	selectedIds,
	onSelect,
}: ConsumablesComboBoxProps) {
	const [search, setSearch] = useState("");
	const [inputValue, setInputValue] = useState("");
	const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

	const { data, isPending, isError, isFetching, refetch } =
		useGetPaginatedDeviceComponents(eden, {
			workspaceId,
			deviceId,
			limit: RESULTS_LIMIT,
			orderBy: "name",
			direction: "asc",
			search: debouncedSearch.trim() || undefined,
		});

	const components = (data?.pages[0]?.items ?? []).filter(
		(component) => !selectedIds.includes(component.id),
	);
	const hasMore = data?.pages[0]?.hasNextPage ?? false;

	return (
		<Combobox
			items={components}
			filter={null}
			value={null}
			isItemEqualToValue={(
				item: DeviceComponentListItem,
				value: DeviceComponentListItem,
			) => item.id === value.id}
			itemToStringLabel={(component: DeviceComponentListItem) => component.name}
			itemToStringValue={(component: DeviceComponentListItem) => component.id}
			inputValue={inputValue}
			onInputValueChange={(value, { reason }) => {
				setInputValue(value);

				if (reason === "input-change") {
					setSearch(value);
				} else if (reason === "input-clear") {
					setSearch("");
				}
			}}
			onValueChange={(component: DeviceComponentListItem | null) => {
				if (!component) {
					return;
				}

				setSearch("");
				setInputValue("");
				onSelect(component);
			}}
		>
			<ComboboxInput
				placeholder="Buscar consumible o componente por nombre o número de parte..."
				className="w-full"
				showClear
			/>

			<ComboboxContent>
				<ComboboxEmpty>
					{isError
						? "No pudimos cargar los componentes."
						: isPending
							? "Buscando componentes…"
							: "No se encontraron componentes."}
				</ComboboxEmpty>

				<ComboboxList>
					{(component: DeviceComponentListItem) => (
						<ComboboxItem
							key={component.id}
							value={component}
							className="gap-2.5 py-2.5"
						>
							<div className="min-w-0 flex-1 space-y-2">
								<div className="flex min-w-0 items-center gap-1">
									<Package className="size-3 shrink-0 text-primary" />

									<p className="truncate text-sm font-medium leading-none">
										{component.name}
									</p>
								</div>

								<div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
									<Hash className="size-3 shrink-0" />

									<span className="truncate">
										{component.partNumber || "Sin número de parte"}
									</span>

									<span className="shrink-0 text-border">·</span>

									<span className="shrink-0">
										{COMPONENT_TYPE_LABELS[component.type]}
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
			</ComboboxContent>
		</Combobox>
	);
}
