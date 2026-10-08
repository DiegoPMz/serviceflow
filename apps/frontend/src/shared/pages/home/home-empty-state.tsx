import {
	CheckCircle2,
	ClipboardList,
	Eye,
	Plus,
	Sparkles,
	UserPlus,
	Users,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export function HomeEmptyState({
	canInviteMembers,
	isReadOnly,
}: {
	canInviteMembers: boolean;
	isReadOnly: boolean;
}) {
	return (
		<div className="grid animate-rise gap-4 xl:grid-cols-12">
			<section className="glass-panel relative overflow-hidden rounded-2xl p-6 sm:p-8 xl:col-span-8 xl:p-10">
				{!isReadOnly && (
					<>
						<div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-primary/15 blur-3xl" />
						<div className="pointer-events-none absolute -bottom-24 left-1/3 size-48 rounded-full bg-success/10 blur-3xl" />
					</>
				)}

				<div className="relative max-w-2xl">
					<div className="mb-7 flex items-center gap-3">
						<div className="grid size-10 place-items-center rounded-xl text-primary shadow-flow md:size-12">
							{isReadOnly ? (
								<ClipboardList className="size-5" />
							) : (
								<Sparkles className="size-5" />
							)}
						</div>

						<div>
							<p className="font-mono text-[10px] uppercase tracking-widest text-primary">
								{isReadOnly ? "Espacio sin actividad" : "Espacio preparado"}
							</p>

							<p className="mt-0.5 text-xs text-muted-foreground">
								{isReadOnly
									? "Todavía no hay órdenes registradas"
									: "Sin órdenes ni actividad todavía"}
							</p>
						</div>
					</div>

					{isReadOnly ? (
						<>
							<p className="max-w-xl font-display text-3xl font-bold leading-tight sm:text-4xl">
								Todavía no hay actividad que consultar.
							</p>

							<p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
								Cuando se registren órdenes de servicio en este espacio, podrás
								consultar aquí su actividad, historial y estado.
							</p>
						</>
					) : (
						<>
							<p className="max-w-xl font-display text-3xl font-bold leading-tight sm:text-4xl">
								Tu espacio está listo para trabajar.
							</p>

							<p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
								Puedes comenzar preparando tus clientes y dispositivos, o crear
								directamente una orden de servicio.
							</p>
						</>
					)}

					{!isReadOnly && (
						<div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
							<Button variant="default" size="lg">
								<Plus />
								Crear primera orden
							</Button>

							<Button variant="outline" size="lg">
								<Users />
								Agregar cliente
							</Button>
						</div>
					)}

					<div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-5">
						{isReadOnly ? (
							<>
								<ReadOnlyBenefit>Consultar órdenes</ReadOnlyBenefit>

								<ReadOnlyBenefit>Revisar actividad</ReadOnlyBenefit>

								<ReadOnlyBenefit>Ver historial</ReadOnlyBenefit>
							</>
						) : (
							<>
								<Benefit>Seguimiento centralizado</Benefit>

								<Benefit>Historial por equipo</Benefit>

								<Benefit>Trabajo colaborativo</Benefit>
							</>
						)}
					</div>
				</div>
			</section>

			<aside className="glass-panel rounded-2xl p-5 sm:p-6 xl:col-span-4">
				<div>
					<p className="font-display text-lg font-semibold">
						{isReadOnly ? "Consulta" : "Primeros pasos"}
					</p>

					<p className="mt-1 text-xs text-muted-foreground">
						{isReadOnly
							? "Contenido disponible para tu acceso"
							: "Configura tu flujo en pocos minutos"}
					</p>
				</div>

				<div className="mt-5">
					{isReadOnly ? <ViewerEmptySteps /> : <SuccessNotViewerSteps />}
				</div>

				{canInviteMembers && (
					<div className=" pt-4">
						<Button variant="outline" size="lg" className="w-full">
							<UserPlus />
							Invitar a mi equipo
						</Button>
					</div>
				)}
			</aside>
		</div>
	);
}

function Benefit({ children }: { children: React.ReactNode }) {
	return (
		<span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
			<CheckCircle2 className="size-3.5 text-success" />
			{children}
		</span>
	);
}

function ReadOnlyBenefit({ children }: { children: React.ReactNode }) {
	return (
		<span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
			<Eye className="size-3.5" />
			{children}
		</span>
	);
}

const successSteps = [
	[
		"01",
		"Registra clientes y dispositivos",
		"Organiza primero tus clientes y los equipos que tienen registrados.",
	],
	[
		"02",
		"Crea una orden directamente",
		"Empieza con un servicio y registra los datos necesarios mientras creas la orden.",
	],
] as const;

function SuccessNotViewerSteps() {
	return (
		<div className="space-y-4">
			{successSteps.map(([number, title, description]) => (
				<div key={number} className="grid grid-cols-[auto_1fr] gap-3">
					<div className="flex items-start">
						<span className="grid size-7 place-items-center rounded-full bg-foreground/5 font-mono text-[10px] font-semibold text-muted-foreground">
							{number}
						</span>
					</div>

					<div>
						<p className="text-sm font-semibold">{title}</p>

						<p className="mt-1 text-xs leading-5 text-muted-foreground">
							{description}
						</p>
					</div>
				</div>
			))}

			<div className="border-t border-border pt-3">
				<p className="text-xs leading-5 text-muted-foreground">
					Ambas rutas terminan en una{" "}
					<span className="font-medium text-foreground">orden de servicio</span>
					.
				</p>
			</div>
		</div>
	);
}

function ViewerEmptySteps() {
	return (
		<div className="space-y-4">
			<div className="flex gap-3">
				<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground/5">
					<Eye className="size-4 text-muted-foreground" />
				</div>

				<div>
					<p className="text-sm font-semibold">Consulta las órdenes</p>

					<p className="mt-1 text-xs leading-5 text-muted-foreground">
						Podrás consultar las órdenes registradas y su información.
					</p>
				</div>
			</div>

			<div className="flex gap-3">
				<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground/5">
					<ClipboardList className="size-4 text-muted-foreground" />
				</div>

				<div>
					<p className="text-sm font-semibold">Revisa la actividad</p>

					<p className="mt-1 text-xs leading-5 text-muted-foreground">
						Consulta el estado y el historial de la operación.
					</p>
				</div>
			</div>

			<div className="border-t border-border pt-3">
				<p className="text-xs leading-5 text-muted-foreground">
					Tu acceso es de{" "}
					<span className="font-medium text-foreground">solo lectura</span>.
				</p>
			</div>
		</div>
	);
}
