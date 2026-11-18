import { Search, X } from "lucide-react";
import { useState } from "react";
import { useGetPaginatedDevices } from "@/features/device/paginated-devices";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import type { Eden } from "@/shared/http/client";
import { useDebouncedValue } from "@/shared/lib/use-debounced-value";
import { ClientDevicesSectionSkeleton } from "./client-devices-section-skeleton";
import {
	ClientDevicesEmpty,
	ClientDevicesError,
} from "./client-devices-section-states";
import { DeviceAccordionItem } from "./device-accordion-item";

type ClientDevicesSectionProps = {
	eden: Eden;
	workspaceId: string;
	clientId: string;
};

const DEVICES_PAGE_SIZE = 10;

export function ClientDevicesSection({
	eden,
	workspaceId,
	clientId,
}: ClientDevicesSectionProps) {
	const [search, setSearch] = useState("");

	const debouncedSearch = useDebouncedValue(search, 300);
	const normalizedSearch = debouncedSearch.trim();

	const devicesQuery = useGetPaginatedDevices(eden, {
		workspaceId,
		clientId,
		limit: DEVICES_PAGE_SIZE,
		orderBy: "brand",
		direction: "asc",
		search: normalizedSearch || undefined,
	});

	const devices = devicesQuery.data?.pages.flatMap((page) => page.items) ?? [];

	const handleRetry = () => {
		void devicesQuery.refetch();
	};

	const handleLoadMore = () => {
		if (!devicesQuery.hasNextPage || devicesQuery.isFetching) return;

		void devicesQuery.fetchNextPage();
	};

	const shouldAllowSearch =
		devicesQuery.hasNextPage || devicesQuery.hasPreviousPage;

	if (devicesQuery.isPending) {
		return <ClientDevicesSectionSkeleton />;
	}

	return (
		<Card className="animate-rise min-w-0 gap-0 border-border/70 bg-card p-4 shadow-none sm:p-5">
			<ClientDevicesHeader deviceCount={devices.length} />

			{shouldAllowSearch && (
				<ClientDevicesSearch value={search} onChange={setSearch} />
			)}

			{devicesQuery.isError && devices.length === 0 ? (
				<ClientDevicesError onRetry={handleRetry} />
			) : devices.length === 0 ? (
				<ClientDevicesEmpty searching={Boolean(normalizedSearch)} />
			) : (
				<CardContent className="min-w-0 px-0">
					<ul>
						{devices.map((device) => (
							<li key={device.id} className="py-1 first:pt-0 last:pb-0">
								<DeviceAccordionItem
									device={device}
									eden={eden}
									workspaceId={workspaceId}
								/>
							</li>
						))}
					</ul>

					{devicesQuery.hasNextPage && (
						<ClientDevicesPagination
							isLoading={devicesQuery.isFetchingNextPage}
							onLoadMore={handleLoadMore}
						/>
					)}
				</CardContent>
			)}
		</Card>
	);
}

function ClientDevicesHeader({ deviceCount }: { deviceCount: number }) {
	return (
		<CardHeader className="flex flex-row items-center justify-between gap-3 px-0 pb-4 sm:pb-5">
			<div className="space-y-1">
				<CardTitle className="text-sm font-semibold">Dispositivos</CardTitle>

				<p className="text-xs text-muted-foreground">
					Equipos y su historial de servicio
				</p>
			</div>

			<Badge variant="outline" className="tabular-nums">
				{deviceCount}
			</Badge>
		</CardHeader>
	);
}

type ClientDevicesSearchProps = {
	value: string;
	onChange: (value: string) => void;
};

function ClientDevicesSearch({ value, onChange }: ClientDevicesSearchProps) {
	return (
		<div className="relative mb-4">
			<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

			<Input
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder="Buscar por marca, modelo o número de serie..."
				className="h-9 pl-9 pr-9"
				aria-label="Buscar dispositivos"
			/>

			{value.length > 0 && (
				<Button
					type="button"
					variant="ghost"
					size="icon"
					onClick={() => onChange("")}
					aria-label="Limpiar búsqueda"
					className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
				>
					<X className="size-3.5" />
				</Button>
			)}
		</div>
	);
}

type ClientDevicesPaginationProps = {
	isLoading: boolean;
	onLoadMore: () => void;
};

function ClientDevicesPagination({
	isLoading,
	onLoadMore,
}: ClientDevicesPaginationProps) {
	return (
		<div className="flex justify-center pt-2">
			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={isLoading}
				onClick={onLoadMore}
			>
				{isLoading ? "Cargando..." : "Mostrar más"}
			</Button>
		</div>
	);
}
