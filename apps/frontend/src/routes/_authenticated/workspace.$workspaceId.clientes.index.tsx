import { createFileRoute } from "@tanstack/react-router";
import { MousePointerClick } from "lucide-react";
import { ClientDetailEmptyState } from "@/shared/pages/clients";

export const Route = createFileRoute(
	"/_authenticated/workspace/$workspaceId/clientes/",
)({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<ClientDetailEmptyState
			icon={<MousePointerClick />}
			description="Elige un cliente del directorio para ver su contacto, dispositivos y órdenes."
			title="Selecciona un cliente"
		/>
	);
}
