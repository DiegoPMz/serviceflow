import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { ArrowRight, ClipboardList, Package } from "lucide-react";
import { COMPONENT_TYPE_LABELS } from "@/features/device/common/component-type.presentation";
import type { DeviceComponentListItem } from "@/features/device/paginated-device-components";
import { ORDER_STATUS_PRESENTATION } from "@/features/order/common/order-status.presentation";
import type { OrderSummary } from "@/features/order/paginated-orders";
import { IconContainer } from "@/shared/components/icon-container";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { buttonVariants } from "@/shared/components/ui/button";
import { formatRelativeTime } from "@/shared/lib/format-relative-time";
import { getInitials } from "@/shared/lib/get-initials";
import { ClientDetailEmptyState } from "../client-detail-empty-state";
import {
	LoadMoreButton,
	SectionError,
	SectionHeader,
	SectionSkeleton,
} from "./device-accordion-section-ui";

type DeviceComponentsSectionProps = {
	components: DeviceComponentListItem[];
	hasMore: boolean;
	isPending: boolean;
	isError: boolean;
	isFetchingNextPage: boolean;
	onRetry: () => void;
	onLoadMore: () => void;
};

export function DeviceComponentsSection({
	components,
	hasMore,
	isPending,
	isError,
	isFetchingNextPage,
	onRetry,
	onLoadMore,
}: DeviceComponentsSectionProps) {
	return (
		<section className="min-w-0">
			<SectionHeader
				title="Componentes de servicio"
				description="Componentes asociados al equipo"
				count={isPending ? null : `${components.length}${hasMore ? "+" : ""}`}
			/>

			{isPending ? (
				<SectionSkeleton />
			) : isError ? (
				<SectionError
					description="Ocurrió un error al consultar los componentes del dispositivo."
					onRetry={onRetry}
				/>
			) : components.length > 0 ? (
				<>
					<ul className="divide-y divide-border">
						{components.map((component) => (
							<li
								key={component.id}
								className="flex min-w-0 items-center gap-2.5 py-3 first:pt-0 last:pb-0"
							>
								<IconContainer
									className="size-6"
									iconClassName="size-3.5"
									icon={Package}
								/>

								<div className="min-w-0 flex-1">
									<p className="truncate text-xs font-semibold">
										{component.name}
									</p>

									<p className="mt-1 truncate text-[10px] text-muted-foreground">
										{component.partNumber || "Sin número de parte"}
									</p>
								</div>

								<Badge
									variant="outline"
									className="shrink-0 text-[9px] font-medium"
								>
									{COMPONENT_TYPE_LABELS[component.type]}
								</Badge>
							</li>
						))}
					</ul>

					{hasMore && (
						<LoadMoreButton
							isLoading={isFetchingNextPage}
							onClick={onLoadMore}
						/>
					)}
				</>
			) : (
				<ClientDetailEmptyState
					icon={<Package />}
					title="Sin componentes"
					description="Este dispositivo todavía no tiene componentes de servicio asociados."
				/>
			)}
		</section>
	);
}

type DeviceOrdersSectionProps = {
	workspaceId: string;
	orders: OrderSummary[];
	totalOrders: number;
	hasMore: boolean;
	isPending: boolean;
	isError: boolean;
	onRetry: () => void;
	onLoadMore: () => void;
};

export function DeviceOrdersSection({
	workspaceId,
	orders,
	totalOrders,
	hasMore,
	isPending,
	isError,
	onRetry,
	onLoadMore,
}: DeviceOrdersSectionProps) {
	return (
		<section className="min-w-0">
			<SectionHeader
				title="Órdenes de servicio"
				description="Historial de servicios del equipo"
				count={isPending ? null : totalOrders}
			/>

			{isPending ? (
				<SectionSkeleton />
			) : isError ? (
				<SectionError
					description="Ocurrió un error al consultar las órdenes del dispositivo."
					onRetry={onRetry}
				/>
			) : orders.length > 0 ? (
				<>
					<ul className="divide-y divide-border">
						{orders.map((order) => {
							const status = ORDER_STATUS_PRESENTATION[order.status];
							const relativeDate = formatRelativeTime(order.createdAt);

							return (
								<li key={order.id} className="first:pt-0 last:pb-0">
									<Link
										to="/workspace/$workspaceId/orden/$orderId"
										params={{ orderId: order.id, workspaceId: workspaceId }}
										className={cn(
											buttonVariants({ variant: "ghost" }),
											"m-0 rounded-none w-full flex min-w-0 items-center gap-2.5 px-0 py-3 h-fit group",
										)}
									>
										<Avatar size="sm" className="size-8 shrink-0 rounded-lg">
											<AvatarImage src={order.userPictureUrl ?? undefined} />

											<AvatarFallback className="rounded-lg bg-sidebar-accent text-[9px] font-semibold text-sidebar-foreground">
												{getInitials(order.createdByName)}
											</AvatarFallback>
										</Avatar>

										<div className="min-w-0 flex-1 text-left">
											<div className="flex items-center gap-3">
												<p className="truncate text-xs font-semibold tabular-nums">
													{order.folio}
												</p>

												<Badge
													variant="outline"
													className={cn(
														"shrink-0 text-[9px] font-semibold",
														status.badgeClassName,
														"border-t-0 border-l-0 border-r-0",
													)}
												>
													{status.label}
												</Badge>
											</div>

											<p
												className="mt-1 truncate text-[10px] text-muted-foreground"
												title={order.createdByName}
											>
												{order.createdByName} ·{" "}
												<time title={relativeDate.title}>
													{relativeDate.label}
												</time>
											</p>
										</div>

										<ArrowRight className="text-muted-foreground mr-3 transition-transform ease-out duration-300 group-hover:translate-x-1" />
									</Link>
								</li>
							);
						})}
					</ul>

					{hasMore && <LoadMoreButton onClick={onLoadMore} />}
				</>
			) : (
				<ClientDetailEmptyState
					icon={<ClipboardList />}
					title="Sin órdenes"
					description="Este dispositivo todavía no tiene órdenes de servicio."
				/>
			)}
		</section>
	);
}
