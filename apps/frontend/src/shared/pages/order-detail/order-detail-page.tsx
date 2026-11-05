import { cn } from "cn";
import {
	CalendarDays,
	CheckCircle2,
	ChevronDown,
	Clock3,
	Cpu,
	FileDown,
	Hash,
	LockKeyhole,
	Mail,
	MapPin,
	Package,
	Phone,
	Share2,
	UserRound,
	Wrench,
	XCircle,
} from "lucide-react";
import { ORDER_STATUS_PRESENTATION } from "@/features/order/common/order-status.presentation";
import { useGetOrderDetails } from "@/features/order/order-details";
import { useDownloadOrderDocument } from "@/features/order/order-document";
import type { WorkspacePermissions } from "@/features/workpace/common/workspace-permissions";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
import type { Eden } from "@/shared/http/client";
import { formatRelativeTime } from "@/shared/lib/format-relative-time";
import { ChangeOrderStatusDialog } from "./change-order-status-dialog";
import { DetailCard } from "./detail-card";
import { DetailRow } from "./detail-row";
import {
	getInitials,
	getServiceTypeLabel,
	getSupplyTypeLabel,
} from "./order-detail.presentation";
import {
	getOrderClientCopyText,
	getOrderDeviceCopyText,
	getOrderObservationsCopyText,
	getOrderSummaryCopyText,
	getOrderSuppliesCopyText,
} from "./order-detail-copy";
import { useOrderShare } from "./use-order-share.hook";
import { useOrderStatusChange } from "./use-order-status-change.hook";

interface OrderDetailPageProps {
	eden: Eden;
	permissions: WorkspacePermissions;
	orderDetails: { orderId: string; workspaceId: string };
}

export function OrderDetailPage({
	eden,
	permissions,
	orderDetails,
}: OrderDetailPageProps) {
	const { data: order } = useGetOrderDetails(eden, orderDetails);
	const downloadDocument = useDownloadOrderDocument();
	const { isSharing, shareOrder } = useOrderShare(order.folio);
	const {
		confirmStatusChange,
		handleDialogOpenChange,
		isUpdating,
		requestStatusChange,
		requestedStatus,
		statusError,
	} = useOrderStatusChange({ eden, ...orderDetails });

	const serviceTypeLabel = getServiceTypeLabel(order.serviceType);
	const status = ORDER_STATUS_PRESENTATION[order.status];
	const isOrderPending = order.status === "pendiente";
	const canChangeStatus = permissions.canChangeOrderStatus;

	const handleDownload = async () =>
		await downloadDocument.mutateAsync({
			workspaceId: orderDetails.workspaceId,
			orderId: orderDetails.orderId,
			eden,
		});

	return (
		<>
			<main className="relative px-4 py-6 sm:px-6 lg:px-8">
				<header className="mb-6 flex flex-wrap items-center justify-between gap-4">
					<div className="flex min-w-0 items-center gap-3">
						<div className="min-w-0">
							<p className="text-[11px] uppercase tracking-widest text-primary">
								Órdenes / Detalle
							</p>

							<h2 className="mt-1 truncate text-3xl font-bold lg:text-4xl">
								Orden: {order.folio}
							</h2>
						</div>
					</div>

					<div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
						<Button
							type="button"
							variant="secondary"
							size="sm"
							onClick={() => void shareOrder()}
							disabled={isSharing}
							aria-label="Compartir enlace de la orden"
							className="size-9 px-0 sm:h-9 sm:w-auto sm:px-3"
						>
							<Share2 className="size-4" />
							<span className="hidden sm:inline">
								{isSharing ? "Compartiendo…" : "Compartir"}
							</span>
						</Button>

						<Button
							type="button"
							variant="secondary"
							size="sm"
							onClick={() => order.status !== "cancelada" && handleDownload()}
							disabled={
								!order.hasDocument ||
								downloadDocument.isPending ||
								order.status === "cancelada"
							}
							aria-label={
								order.hasDocument
									? "Descargar documento de la orden"
									: "Esta orden no tiene documento generado"
							}
							title={
								order.hasDocument
									? "Descargar documento de la orden"
									: "Esta orden aún no tiene documento generado"
							}
							className="size-9 px-0 sm:h-9 sm:w-auto sm:px-3"
						>
							<FileDown className="size-4" />
							<span className="hidden sm:inline">
								{downloadDocument.isPending
									? "Descargando…"
									: order.hasDocument
										? "Descargar documento"
										: "Sin documento"}
							</span>
						</Button>
					</div>
				</header>

				<div className="min-w-0 space-y-4">
					{/* Resumen de la orden y estado */}
					<DetailCard
						title="Orden de servicio"
						description="Resumen del servicio."
						copyText={getOrderSummaryCopyText(order)}
					>
						<div className="flex flex-col gap-6 xl:flex-row">
							<div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:flex-3">
								<div className="min-w-0 space-y-1.5">
									<p className="flex items-center gap-2 text-xs text-muted-foreground">
										<CalendarDays className="size-3.5" />
										Fecha de creación
									</p>

									<p className="text-sm font-medium">
										{formatRelativeTime(order.createdAt).label}
									</p>
								</div>

								<div className="min-w-0 space-y-1.5">
									<p className="flex items-center gap-2 text-xs text-muted-foreground">
										<Clock3 className="size-3.5" />
										Última actualización
									</p>

									<p className="text-sm font-medium">
										{formatRelativeTime(order.updatedAt).label}
									</p>
								</div>

								<div className="min-w-0 space-y-1.5">
									<p className="flex items-center gap-2 text-xs text-muted-foreground">
										<UserRound className="size-3.5" />
										Creada por
									</p>

									<div className="flex min-w-0 items-center gap-2">
										<Avatar size="sm">
											{order.technician.pictureUrl && (
												<AvatarImage
													src={order.technician.pictureUrl}
													alt={order.technician.name}
												/>
											)}

											<AvatarFallback>
												{getInitials(order.technician.name)}
											</AvatarFallback>
										</Avatar>

										<p className="truncate text-sm font-medium">
											{order.technician.name}
										</p>
									</div>
								</div>

								<div className="min-w-0 space-y-1.5">
									<p className="flex items-center gap-2 text-xs text-muted-foreground">
										<Wrench className="size-3.5" />
										Tipo de servicio
									</p>

									<p className="truncate text-sm font-medium">
										{serviceTypeLabel}
									</p>
								</div>
							</div>

							<aside className="min-w-0 border-t border-border/70 pt-5 xl:flex-2 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
								<div className="flex items-center justify-between gap-3">
									<h3 className="text-sm font-semibold">Estado de la orden</h3>

									<Badge
										variant="outline"
										className={cn("font-semibold", status.badgeClassName)}
									>
										{status.label}
									</Badge>
								</div>

								<p className="mt-2 text-xs leading-relaxed text-muted-foreground">
									{status.description}
								</p>

								{isOrderPending && canChangeStatus && (
									<div className="mt-4 flex flex-col gap-1">
										<Button
											type="button"
											size="lg"
											onClick={() => requestStatusChange("entregada")}
											disabled={isUpdating}
											className="w-full"
										>
											<CheckCircle2 className="size-3.5" />
											{isUpdating ? "Actualizando..." : "Marcar como entregada"}
										</Button>

										<Button
											type="button"
											variant="outline"
											size="lg"
											onClick={() => requestStatusChange("cancelada")}
											disabled={isUpdating}
											className="w-full text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
										>
											<XCircle className="size-3.5" />
											Cancelar orden
										</Button>
									</div>
								)}

								{isOrderPending && !canChangeStatus && (
									<div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-3">
										<LockKeyhole className="size-3.5 shrink-0 text-muted-foreground" />

										<p className="text-xs text-muted-foreground">
											No tienes permisos para cambiar el estado de esta orden.
										</p>
									</div>
								)}

								{!isOrderPending && (
									<div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-3">
										<LockKeyhole className="size-3.5 shrink-0 text-muted-foreground" />

										<p className="text-xs text-muted-foreground">
											El estado de esta orden es definitivo.
										</p>
									</div>
								)}
							</aside>
						</div>
					</DetailCard>

					{/* Cliente y equipo */}
					<div className="grid gap-4 xl:grid-cols-2">
						<DetailCard
							title="Cliente"
							description="Información de contacto del cliente."
							copyText={getOrderClientCopyText(order.client)}
						>
							<div className="divide-y divide-border/60">
								<DetailRow
									label="Nombre"
									value={order.client.name}
									icon={<UserRound className="size-3.5" />}
								/>

								<DetailRow
									label="Teléfono"
									value={order.client.phone || "Sin teléfono"}
									icon={<Phone className="size-3.5" />}
								/>

								<DetailRow
									label="Correo"
									value={order.client.email || "Sin correo"}
									icon={<Mail className="size-3.5" />}
								/>

								<DetailRow
									label="Ubicación"
									value={order.client.location || "Sin ubicación"}
									icon={<MapPin className="size-3.5" />}
								/>
							</div>
						</DetailCard>

						<DetailCard
							title="Equipo"
							description="Dispositivo asociado a la orden de servicio."
							copyText={getOrderDeviceCopyText(order.device)}
						>
							<div className="divide-y divide-border/60">
								<DetailRow
									label="Dispositivo"
									value={order.device.fullName || "Sin equipo"}
									icon={<Cpu className="size-3.5" />}
								/>

								<DetailRow
									label="Número de serie"
									value={order.device.serialNumber || "Sin número de serie"}
									icon={<Hash className="size-3.5" />}
								/>
							</div>
						</DetailCard>
					</div>

					{/* Observaciones */}
					<DetailCard
						title="Observaciones"
						description="Notas adicionales registradas en esta orden."
						copyText={getOrderObservationsCopyText(order.observations)}
					>
						{order.observations.trim() ? (
							<p className="whitespace-pre-wrap text-sm leading-6 text-foreground/85">
								{order.observations}
							</p>
						) : (
							<div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-3">
								<p className="text-sm font-medium">Sin observaciones</p>

								<p className="mt-0.5 text-xs text-muted-foreground">
									No se registraron notas adicionales para esta orden.
								</p>
							</div>
						)}
					</DetailCard>

					{/* Insumos y refacciones */}
					<DetailCard
						title="Insumos y refacciones"
						description="Insumos, refacciones y otros componentes utilizados."
						copyText={getOrderSuppliesCopyText(order.supplies)}
					>
						{order.supplies.length === 0 ? (
							<div className="flex items-center gap-3 rounded-lg border border-dashed border-border/80 bg-muted/20 p-3">
								<Package className="size-5 shrink-0 text-muted-foreground" />

								<p className="text-sm text-muted-foreground">
									Esta orden no tiene insumos registrados.
								</p>
							</div>
						) : (
							<Collapsible className="rounded-lg border border-border/70">
								<CollapsibleTrigger className="flex w-full items-center justify-between gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/40">
									<div className="flex min-w-0 items-center gap-3">
										<Package className="size-4 shrink-0 text-muted-foreground" />

										<div className="min-w-0">
											<p className="text-sm font-medium">Insumos utilizados</p>

											<p className="text-xs text-muted-foreground">
												{order.supplies.length}{" "}
												{order.supplies.length === 1
													? "insumo registrado"
													: "insumos registrados"}
											</p>
										</div>
									</div>

									<ChevronDown className="size-4 shrink-0 text-muted-foreground" />
								</CollapsibleTrigger>

								<CollapsibleContent className="border-t border-border/70 px-3">
									<ul className="divide-y divide-border/60">
										{order.supplies.map((supply) => (
											<li
												key={supply.id}
												className="flex min-w-0 items-center justify-between gap-3 py-3"
											>
												<div className="min-w-0">
													<p className="min-w-0 wrap-break-word text-sm font-medium">
														{supply.name}
													</p>

													<p className="mt-0.5 text-xs text-muted-foreground">
														{supply.quantity}{" "}
														{supply.quantity === 1 ? "unidad" : "unidades"}
														{supply.partNumber ? ` · ${supply.partNumber}` : ""}
													</p>
												</div>

												<Badge
													variant="secondary"
													className="shrink-0 font-normal"
												>
													{getSupplyTypeLabel(supply.type)}
												</Badge>
											</li>
										))}
									</ul>
								</CollapsibleContent>
							</Collapsible>
						)}
					</DetailCard>
				</div>
			</main>

			<ChangeOrderStatusDialog
				requestedStatus={requestedStatus}
				folio={order.folio}
				isUpdating={isUpdating}
				error={statusError}
				onOpenChange={handleDialogOpenChange}
				onConfirm={() => void confirmStatusChange()}
			/>
		</>
	);
}
