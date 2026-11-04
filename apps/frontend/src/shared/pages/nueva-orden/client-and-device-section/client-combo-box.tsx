import { Phone, Plus, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import type { ClientListItem } from "@/features/client/paginated-clients";
import { useGetPaginatedClients } from "@/features/client/paginated-clients";
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

export type ClientsComboBoxProps = {
	eden: Eden;
	workspaceId: string;
	selectedClient: ClientListItem | null;
	onSelect: (client: ClientListItem | null) => void;
	onCreateClient?: () => void;
};

const RESULTS_LIMIT = 4;
const SEARCH_DEBOUNCE_MS = 400;

export function ClientsComboBox({
	eden,
	workspaceId,
	selectedClient,
	onSelect,
	onCreateClient,
}: ClientsComboBoxProps) {
	const [search, setSearch] = useState("");
	const [inputValue, setInputValue] = useState(selectedClient?.name ?? "");
	const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

	useEffect(() => {
		setInputValue(selectedClient?.name ?? "");
	}, [selectedClient]);

	const { data, isPending, isError, isFetching, refetch } =
		useGetPaginatedClients(eden, {
			workspaceId,
			limit: RESULTS_LIMIT,
			orderBy: "name",
			direction: "asc",
			search: debouncedSearch.trim() || undefined,
		});

	const clients = data?.pages[0]?.items ?? [];
	const hasMore = data?.pages[0]?.hasNextPage ?? false;

	return (
		<Combobox
			items={clients}
			filter={null}
			value={selectedClient}
			isItemEqualToValue={(item: ClientListItem, value: ClientListItem) =>
				item.id === value.id
			}
			itemToStringLabel={(client: ClientListItem) => client.name}
			itemToStringValue={(client: ClientListItem) => client.id}
			inputValue={inputValue}
			onInputValueChange={(value, { reason }) => {
				setInputValue(value);

				if (reason === "input-change") {
					setSearch(value);
				} else if (reason === "input-clear") {
					setSearch("");
				}
			}}
			onValueChange={(client) => {
				setSearch("");
				onSelect(client ?? null);
			}}
		>
			<ComboboxInput
				placeholder="Buscar cliente por nombre, teléfono o correo..."
				className="w-full"
				showClear
			/>

			<ComboboxContent>
				<ComboboxEmpty>
					{isError
						? "No pudimos cargar los clientes."
						: isPending
							? "Buscando clientes…"
							: "No se encontraron clientes."}
				</ComboboxEmpty>

				<ComboboxList>
					{(client: ClientListItem) => (
						<ComboboxItem
							key={client.id}
							value={client}
							className="gap-2.5 py-2.5"
						>
							<div className="min-w-0 flex-1 space-y-2">
								<div className="flex items-center gap-1">
									<UserRound className="size-3 text-primary" />

									<p className="truncate text-sm font-medium leading-none">
										{client.name}
									</p>
								</div>

								<div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
									<Phone className="size-3 shrink-0" />

									<span className="truncate">
										{client.phoneNumber || "Sin teléfono"}
									</span>

									<span className="shrink-0 text-border">·</span>

									<span className="truncate">
										{client.email || "Sin correo"}
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
				<div className="border-t border-border/70 p-1">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="w-full justify-start"
						onClick={onCreateClient}
					>
						<Plus className="size-4" />
						Crear nuevo cliente
					</Button>
				</div>
			</ComboboxContent>
		</Combobox>
	);
}
