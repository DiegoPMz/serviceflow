import type { OrderDetails } from "../order-details";

type OrderStatus = OrderDetails["status"];

interface OrderStatusPresentation {
	label: string;
	description: string;
	badgeClassName: string;
}

export const ORDER_STATUS_PRESENTATION = {
	pendiente: {
		label: "Pendiente",
		description:
			"La orden sigue abierta. Puedes marcarla como entregada o cancelarla.",
		badgeClassName: "border border-2 border-sky-500 text-sky-500",
	},
	entregada: {
		label: "Entregada",
		description:
			"La orden fue marcada como entregada. Su estado ya no se puede modificar.",
		badgeClassName: "border border-2 border-success text-success",
	},
	cancelada: {
		label: "Cancelada",
		description: "La orden fue cancelada. Su estado ya no se puede modificar.",
		badgeClassName: "border border-2 border-destructive text-destructive",
	},
} satisfies Record<OrderStatus, OrderStatusPresentation>;
