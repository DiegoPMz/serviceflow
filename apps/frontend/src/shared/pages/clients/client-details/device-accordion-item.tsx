import { cn } from "cn";
import { ChevronDown, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { useGetPaginatedDeviceComponents } from "@/features/device/paginated-device-components";
import type { DeviceListItem } from "@/features/device/paginated-devices";
import { useGetPaginatedOrders } from "@/features/order/paginated-orders";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
import type { Eden } from "@/shared/http/client";
import {
	DeviceComponentsSection,
	DeviceOrdersSection,
} from "./device-accordion-sections";

const COMPONENTS_PAGE_SIZE = 20;
const ORDERS_INITIAL_PAGE_SIZE = 5;
const ORDERS_PAGE_STEP = 5;
const ORDERS_MAX_PAGE_SIZE = 30;
const DETAILS_DELAY_MS = 250;

type DeviceAccordionItemProps = {
	eden: Eden;
	device: DeviceListItem;
	workspaceId: string;
};

export function DeviceAccordionItem({
	eden,
	device,
	workspaceId,
}: DeviceAccordionItemProps) {
	const [open, setOpen] = useState(false);
	const [delayElapsed, setDelayElapsed] = useState(false);
	const [ordersPageSize, setOrdersPageSize] = useState(
		ORDERS_INITIAL_PAGE_SIZE,
	);

	useEffect(() => {
		if (!open || delayElapsed) return;

		const timeoutId = window.setTimeout(() => {
			setDelayElapsed(true);
		}, DETAILS_DELAY_MS);

		return () => window.clearTimeout(timeoutId);
	}, [open, delayElapsed]);

	const enabled = open && delayElapsed;

	const componentsQuery = useGetPaginatedDeviceComponents(eden, {
		workspaceId,
		deviceId: device.id,
		limit: COMPONENTS_PAGE_SIZE,
		orderBy: "name",
		direction: "asc",
		enabled,
	});

	const ordersQuery = useGetPaginatedOrders(eden, {
		workspaceId,
		deviceId: device.id,
		page: 1,
		pageSize: ordersPageSize,
		direction: "desc",
		enabled,
	});

	const components =
		componentsQuery.data?.pages.flatMap((page) => page.items) ?? [];
	const componentsHasMore =
		componentsQuery.data?.pages.at(-1)?.hasNextPage ?? false;

	const orders = ordersQuery.data?.items ?? [];
	const ordersTotal = ordersQuery.data?.totalItems ?? 0;
	const ordersHasMore =
		ordersTotal > ordersPageSize && ordersPageSize < ORDERS_MAX_PAGE_SIZE;

	return (
		<Collapsible
			open={open}
			onOpenChange={setOpen}
			className={cn(open && "ring ring-border/70 rounded-lg")}
		>
			<CollapsibleTrigger
				render={
					<Button
						variant={"outline"}
						type="button"
						aria-label={`${open ? "Contraer" : "Expandir"} ${device.brand} ${device.model}`}
						className={cn(
							"flex w-full h-fit min-w-0 items-center gap-3 text-left p-3",
							open && "border-none rounded-b-none",
						)}
					>
						<div className="grid size-7 shrink-0 place-items-center rounded-sm bg-sidebar-accent text-primary">
							<Printer className="size-4" />
						</div>

						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-semibold tracking-tight">
								{device.brand} {device.model}
							</p>

							<p className="mt-1 truncate text-xs text-muted-foreground">
								{device.serialNumber
									? `N.º de serie: ${device.serialNumber}`
									: "Sin número de serie"}
							</p>
						</div>

						{ordersTotal > 0 && (
							<Badge
								variant="outline"
								className="hidden shrink-0 tabular-nums sm:inline-flex"
							>
								{ordersTotal} {ordersTotal === 1 ? "órden" : "órdenes"}
							</Badge>
						)}

						<ChevronDown
							className={cn(
								"size-4 shrink-0 text-muted-foreground/60",
								"transition-transform duration-200",
								open && "rotate-180",
							)}
						/>
					</Button>
				}
			/>

			<CollapsibleContent>
				<div className="grid min-w-0 gap-5 px-3 py-4 sm:grid-cols-2">
					{delayElapsed && (
						<>
							<DeviceComponentsSection
								components={components}
								hasMore={componentsHasMore}
								isPending={componentsQuery.isPending}
								isError={componentsQuery.isError}
								isFetchingNextPage={componentsQuery.isFetchingNextPage}
								onRetry={() => void componentsQuery.refetch()}
								onLoadMore={() => void componentsQuery.fetchNextPage()}
							/>

							<DeviceOrdersSection
								workspaceId={workspaceId}
								orders={orders}
								totalOrders={ordersTotal}
								hasMore={ordersHasMore}
								isPending={ordersQuery.isPending}
								isError={ordersQuery.isError}
								onRetry={() => void ordersQuery.refetch()}
								onLoadMore={() =>
									setOrdersPageSize((current) =>
										Math.min(current + ORDERS_PAGE_STEP, ORDERS_MAX_PAGE_SIZE),
									)
								}
							/>
						</>
					)}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
