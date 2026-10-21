import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { CalendarDays, ChevronRight, Printer } from "lucide-react";
import type { OrderSummary } from "@/features/order/paginated-orders";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";

export function OrderCard({ order }: { order: OrderSummary }) {
	const status = orderStatusPresentation[order.status];
	const date = formatOrderDate(order.createdAt);

	return (
		<Link
			from="/workspace/$workspaceId/"
			to="/workspace/$workspaceId/orden/$orderId"
			params={{ orderId: order.id }}
			aria-label={`Abrir orden ${order.folio} de ${order.clientName}`}
			className={cn(
				"group flex w-full min-w-0 flex-col gap-2 rounded-xl",
				"border border-border/70 bg-card p-4 text-left",
				"transition-colors duration-150",
				"hover:border-sidebar-border hover:bg-sidebar-accent",
				"focus-visible:outline-none focus-visible:ring-1",
				"focus-visible:ring-sidebar-ring focus-visible:ring-offset-1",
				"focus-visible:ring-offset-background",
			)}
		>
			{/* Folio y estado */}
			<div className="flex min-w-0 items-start justify-between gap-3">
				<div className="flex min-w-0 flex-wrap items-center gap-2">
					<span className="text-[13px] font-semibold tracking-wide text-card-foreground tabular-nums">
						{order.folio}
					</span>

					<Badge
						variant="outline"
						className={cn(
							"text-[10px] border-2 font-semibold ",
							status.badgeClassName,
						)}
					>
						{status.label}
					</Badge>
				</div>

				<time
					dateTime={date.dateTime}
					title={date.title}
					className="flex shrink-0 items-center gap-1.5 pt-0.5 text-[11px] tabular-nums text-muted-foreground"
				>
					<CalendarDays className="size-3.5 shrink-0" />
					{date.label}
				</time>
			</div>

			{/* Información principal */}
			<div className="min-w-0">
				<p className="truncate text-sm font-semibold tracking-tight text-card-foreground">
					{order.clientName}
				</p>

				<p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
					<Printer className="size-3.5 shrink-0" />

					<span className="truncate">{order.deviceFullName}</span>
				</p>
			</div>

			{/* Responsable */}
			<div className="flex min-w-0 items-center gap-2.5 border-t border-border/70 pt-3">
				<Avatar className="size-7 shrink-0">
					<AvatarImage src={order.userPictureUrl ?? undefined} alt="" />

					<AvatarFallback className="bg-sidebar-accent text-[9px] font-semibold text-sidebar-foreground">
						{getInitials(order.createdByName)}
					</AvatarFallback>
				</Avatar>

				<div className="min-w-0 flex-1">
					<p className="text-[10px] leading-none text-muted-foreground">
						Creada por
					</p>

					<p className="mt-1 truncate text-xs font-medium text-card-foreground">
						{order.createdByName}
					</p>
				</div>

				<ChevronRight
					aria-hidden="true"
					className={cn(
						"size-4 shrink-0 text-muted-foreground/60",
						"transition-colors group-hover:text-sidebar-foreground",
					)}
				/>
			</div>
		</Link>
	);
}

const orderStatusPresentation = {
	pendiente: {
		label: "Pendiente",
		badgeClassName: "border-orange-500 bg-transparent text-orange-500",
	},
	entregada: {
		label: "Entregada",
		badgeClassName: "border-success/80 bg-transparent text-success",
	},
	cancelada: {
		label: "Cancelada",
		badgeClassName: "border-slate-500 bg-transparent text-slate-500",
	},
} satisfies Record<
	OrderSummary["status"],
	{
		label: string;
		badgeClassName: string;
	}
>;

const orderDateFormatter = new Intl.DateTimeFormat("es-MX", {
	day: "2-digit",
	month: "short",
});

const orderDateTitleFormatter = new Intl.DateTimeFormat("es-MX", {
	dateStyle: "medium",
	timeStyle: "short",
});

function formatOrderDate(value: string) {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return {
			label: "Sin fecha",
			dateTime: undefined,
			title: undefined,
		};
	}

	return {
		label: orderDateFormatter.format(date).replace(/\.$/, ""),
		dateTime: value,
		title: orderDateTitleFormatter.format(date),
	};
}

function getInitials(name: string) {
	const words = name.trim().split(/\s+/).filter(Boolean);

	return (
		words
			.slice(0, 2)
			.map((word) => word[0])
			.join("")
			.toUpperCase() || "U"
	);
}
