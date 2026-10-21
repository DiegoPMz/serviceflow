import { Activity, ClipboardList } from "lucide-react";

export function ViewerEmptySteps() {
	return (
		<div className="flex flex-col gap-5">
			<div className="flex min-w-0 gap-3">
				<div className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-accent text-sidebar-foreground/70">
					<ClipboardList className="size-4" />
				</div>

				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold">Consulta las órdenes</p>

					<p className="mt-1.5 text-xs leading-5 text-muted-foreground">
						Accede a los datos, estados e historial de los servicios
						registrados.
					</p>
				</div>
			</div>

			<div className="flex min-w-0 gap-3">
				<div className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-accent text-sidebar-foreground/70">
					<Activity className="size-4" />
				</div>

				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold">Revisa la actividad</p>

					<p className="mt-1.5 text-xs leading-5 text-muted-foreground">
						Consulta los movimientos y el estado de la operación a medida que se
						registren.
					</p>
				</div>
			</div>

			<div className="border-t border-border/70 pt-3">
				<p className="text-xs leading-5 text-muted-foreground">
					Tu acceso permite consultar información, pero no crear órdenes ni
					clientes.
				</p>
			</div>
		</div>
	);
}
