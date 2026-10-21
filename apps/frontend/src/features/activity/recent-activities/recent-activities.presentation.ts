import type { RecentActivity } from "./recent-activities.types";

export interface RecentActivityPresentation {
	label: string;
	toneClassName: string;
}

type ActivityMetadata = NonNullable<RecentActivity["metadata"]>;

type OrderStatusChangeMetadata = Extract<
	ActivityMetadata,
	{ newStatus: unknown }
>;

const ORDER_STATUS_PRESENTATION = {
	pendiente: { label: "reabierta", toneClassName: "bg-warning" },
	entregada: { label: "entregada", toneClassName: "bg-success" },
	cancelada: { label: "cancelada", toneClassName: "bg-destructive" },
} satisfies Record<
	OrderStatusChangeMetadata["newStatus"],
	{ label: string; toneClassName: string }
>;

export function describeRecentActivity(
	activity: RecentActivity,
): RecentActivityPresentation {
	switch (activity.type) {
		case "ORDER_CREATED":
			return {
				label: `${activity.entityLabel} creada · ${activity.actorName}`,
				toneClassName: "bg-primary",
			};

		case "ORDER_STATUS_CHANGED":
			return describeOrderStatusChange(activity);

		case "CLIENT_CREATED":
			return {
				label: `Cliente ${activity.entityLabel} registrado · ${activity.actorName}`,
				toneClassName: "bg-muted-foreground",
			};

		case "DEVICE_REGISTERED":
			return {
				label: `Equipo ${activity.entityLabel} registrado · ${activity.actorName}`,
				toneClassName: "bg-muted-foreground",
			};

		case "CONSUMABLE_REGISTERED":
			return describeConsumablesRegistered(activity);
	}
}

function describeOrderStatusChange(
	activity: RecentActivity,
): RecentActivityPresentation {
	const metadata = activity.metadata;

	const presentation =
		metadata && "newStatus" in metadata
			? ORDER_STATUS_PRESENTATION[metadata.newStatus]
			: undefined;

	return {
		label: `${activity.entityLabel} ${presentation?.label ?? "actualizada"} · ${activity.actorName}`,
		toneClassName: presentation?.toneClassName ?? "bg-muted-foreground",
	};
}

function describeConsumablesRegistered(
	activity: RecentActivity,
): RecentActivityPresentation {
	const metadata = activity.metadata;
	const count = metadata && "count" in metadata ? metadata.count : 1;

	return {
		label: `${count} ${count === 1 ? "consumible" : "consumibles"} en ${activity.entityLabel} · ${activity.actorName}`,
		toneClassName: "bg-muted-foreground",
	};
}
