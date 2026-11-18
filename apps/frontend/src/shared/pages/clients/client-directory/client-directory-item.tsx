import { cn } from "cn";
import {
	CalendarClock,
	ChevronRight,
	ClipboardList,
	Mail,
	Phone,
} from "lucide-react";
import { createContext, type ReactNode, useContext } from "react";
import { formatRelativeTime } from "@/shared/lib/format-relative-time";
import type { ClientDirectoryItemData } from "./client-directory.types";

type ClientDirectoryItemProps = {
	client: ClientDirectoryItemData;
	active?: boolean;
	onClick?: () => void;
	children: ReactNode;
};

type ClientItemContextValue = {
	client: ClientDirectoryItemData;
};

const ClientItemContext = createContext<ClientItemContextValue | null>(null);

function useClientItem() {
	const context = useContext(ClientItemContext);

	if (!context) {
		throw new Error(
			"ClientDirectory.Item components must be used within ClientDirectory.Item.",
		);
	}

	return context;
}

function ClientDirectoryItemRoot({
	client,
	active = false,
	onClick,
	children,
}: ClientDirectoryItemProps) {
	return (
		<ClientItemContext.Provider value={{ client }}>
			<button
				type="button"
				onClick={onClick}
				aria-current={active ? "page" : undefined}
				aria-label={`Abrir ficha del cliente ${client.name}`}
				className={cn(
					"group cursor-pointer flex w-full min-w-0 flex-col gap-2 rounded-xl",
					"border border-border/70 bg-card p-4 text-left",
					"transition-colors duration-150",
					"hover:border-sidebar-border hover:bg-sidebar-accent",
					"focus-visible:outline-none focus-visible:ring-1",
					"focus-visible:ring-sidebar-ring focus-visible:ring-offset-1",
					"focus-visible:ring-offset-background",
					active && "border-sidebar-border bg-sidebar-accent",
				)}
			>
				{children}
			</button>
		</ClientItemContext.Provider>
	);
}

function ClientDirectoryItemHeading() {
	const { client } = useClientItem();

	return (
		<div className="flex min-w-0 items-start justify-between gap-3">
			<p
				title={client.name}
				className="truncate text-sm font-semibold tracking-tight"
			>
				{client.name}
			</p>

			<span className="flex shrink-0 items-center gap-1 pt-0.5 text-[11px] font-medium">
				<ClipboardList className="size-3.5 shrink-0 text-primary" />

				{client.ordersCount > 0 ? (
					<span className="tabular-nums">
						{client.ordersCount}{" "}
						{client.ordersCount === 1 ? "órden" : "órdenes"}
					</span>
				) : (
					"Sin órdenes"
				)}
			</span>
		</div>
	);
}

function ClientDirectoryItemContact() {
	const { client } = useClientItem();

	return (
		<div className="grid min-w-0 gap-1.5">
			<p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
				<Mail className="size-3.5 shrink-0" />

				<span className="truncate" title={client.email ?? undefined}>
					{client.email || "Sin correo electrónico"}
				</span>
			</p>

			<p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
				<Phone className="size-3.5 shrink-0" />

				<span className="truncate tabular-nums">
					{client.phone || "Sin teléfono"}
				</span>
			</p>
		</div>
	);
}

function ClientDirectoryItemLastOrder() {
	const { client } = useClientItem();

	const lastOrder = client.lastOrder
		? formatRelativeTime(client.lastOrder)
		: null;
	const lastOrderLabel = lastOrder?.label ?? "Sin actividad";

	return (
		<div className="flex min-w-0 items-center gap-2.5 border-t border-border/70 pt-3">
			<CalendarClock className="size-4 shrink-0 text-muted-foreground" />

			<div className="min-w-0 flex-1">
				<p className="text-[10px] leading-none text-muted-foreground">
					Última orden
				</p>

				<p
					className="mt-1 truncate text-xs font-medium text-card-foreground"
					title={lastOrder?.title ?? undefined}
				>
					{lastOrderLabel}
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
	);
}

export const ClientDirectoryItem = Object.assign(ClientDirectoryItemRoot, {
	Heading: ClientDirectoryItemHeading,
	Contact: ClientDirectoryItemContact,
	LastOrder: ClientDirectoryItemLastOrder,
});
