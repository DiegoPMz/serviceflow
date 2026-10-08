import { cn } from "cn";
import {
	AlertTriangle,
	CheckCircle2,
	CircleAlert,
	Plus,
	RotateCcw,
	Settings,
	ShieldCheck,
	Sparkles,
	UserPlus,
	Users,
	WifiOff,
} from "lucide-react";
import { Button } from "../components/ui/button";

interface HomeStateProps {
	stateVariant: "empty" | "error";
}
export function HomeStateLayout({ stateVariant }: HomeStateProps) {
	return (
		<div className="grid animate-rise gap-4 xl:grid-cols-12">
			<section className="glass-panel relative overflow-hidden rounded-2xl p-6 sm:p-8 xl:col-span-8 xl:p-10">
				{/*blured circles*/}
				<div
					className={cn(
						"pointer-events-none absolute -right-16 -top-20 size-64 rounded-full  blur-3xl",
						stateVariant === "empty" ? "bg-primary/15" : "bg-destructive/10",
					)}
				/>
				{stateVariant === "empty" && (
					<div className="pointer-events-none absolute -bottom-24 left-1/3 size-48 rounded-full bg-success/10 blur-3xl" />
				)}

				<div className="relative max-w-2xl">
					<div className="mb-7 flex items-center gap-3">
						<div
							className={cn(
								"grid shadow-flow size-10 md:size-12 place-items-center rounded-xl ",
								stateVariant === "empty"
									? "text-primary "
									: "text-destructive ",
							)}
						>
							{stateVariant === "empty" ? (
								<Sparkles className="size-5" />
							) : (
								<AlertTriangle className="size-5 " />
							)}
						</div>
						<div>
							<p
								className={cn(
									"font-mono text-[10px] uppercase tracking-widest",
									stateVariant === "empty"
										? "text-primary"
										: "text-destructive",
								)}
							>
								{stateVariant === "empty"
									? "Espacio preparado"
									: "Sin conexión con los datos"}
							</p>
							<p className="mt-0.5 text-xs text-muted-foreground">
								{stateVariant === "empty"
									? "Sin órdenes ni actividad todavía"
									: "Tus cambios guardados están seguros"}
							</p>
						</div>
					</div>

					<p className="max-w-xl font-display text-3xl font-bold leading-tight sm:text-4xl">
						{stateVariant === "empty" && "Tu espacio está listo para trabajar."}
						{stateVariant === "error" && "No pudimos actualizar tu panel."}
					</p>
					<p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
						{stateVariant === "empty" &&
							"Puedes comenzar preparando tus clientes y dispositivos, o crear directamente una orden de servicio."}
						{stateVariant === "error" &&
							"ServiceFlow tuvo un problema temporal al consultar las órdenes y la actividad. Revisa tu conexión o inténtalo de nuevo."}
					</p>
					<div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
						<Button variant="default" size="lg">
							{stateVariant === "empty" && (
								<>
									<Plus /> Crear primera orden
								</>
							)}
							{stateVariant === "error" && (
								<>
									<RotateCcw /> Intentar de nuevo
								</>
							)}
						</Button>
						<Button variant="outline" size="lg">
							{stateVariant === "empty" && (
								<>
									<Users /> Agregar cliente
								</>
							)}
							{stateVariant === "error" && (
								<>
									<Settings /> Revisar configuración
								</>
							)}
						</Button>
					</div>

					{stateVariant === "empty" && (
						<div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-5">
							{[
								"Seguimiento centralizado",
								"Historial por equipo",
								"Trabajo colaborativo",
							].map((benefit) => (
								<span
									key={benefit}
									className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
								>
									<CheckCircle2 className="size-3.5 text-success" />
									{benefit}
								</span>
							))}
						</div>
					)}

					{stateVariant === "error" && (
						<span className="mt-5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
							<ShieldCheck className="size-3.5 text-success" />
							No necesitas volver a capturar información.
						</span>
					)}
				</div>
			</section>

			<aside className="glass-panel rounded-2xl p-5 sm:p-6 xl:col-span-4">
				<div
					className={cn(
						"flex items-center gap-2",
						stateVariant === "empty" && "justify-between",
					)}
				>
					{stateVariant === "empty" && (
						<div>
							<p className="font-display text-lg font-semibold">
								Primeros pasos
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Configura tu flujo en pocos minutos
							</p>
						</div>
					)}

					{stateVariant === "error" && (
						<>
							<WifiOff className="size-4 text-destructive" />
							<p className="font-display text-base font-semibold">
								Qué puedes hacer
							</p>
						</>
					)}
				</div>

				<div className="mt-5 space-y-4">
					{stateVariant === "empty" && <SuccessSteps />}
					{stateVariant === "error" && <ErrorSteps />}
				</div>

				<div className="mt-3 w-full">
					{stateVariant === "empty" && (
						<Button variant="outline" size={"lg"} className="w-full">
							<UserPlus /> Invitar a mi equipo
						</Button>
					)}

					{stateVariant === "error" && (
						<div className=" flex items-center gap-2 rounded-lg border border-border bg-foreground/5 px-3 py-2.5">
							<CircleAlert className="size-2 fill-warning text-warning" />
							<p className="font-mono text-[10px] text-muted-foreground">
								ESTADO · CONEXIÓN INTERRUMPIDA
							</p>
						</div>
					)}
				</div>
			</aside>
		</div>
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
];

function SuccessSteps() {
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

const errorSteps = [
	[
		"01",
		"Comprueba tu conexión",
		"Verifica que este dispositivo tenga acceso a internet.",
	],
	[
		"02",
		"Vuelve a intentarlo",
		"La mayoría de los errores temporales se resuelven en segundos.",
	],
	[
		"03",
		"Revisa la configuración",
		"Confirma los datos del espacio de trabajo si el problema continúa.",
	],
];

function ErrorSteps() {
	return (
		<>
			{errorSteps.map(([number, title, description]) => (
				<div key={number} className="grid grid-cols-[auto_1fr] gap-3">
					<div className="flex flex-col items-center">
						<span className="grid min-h-7 size-7 place-items-center rounded-full bg-foreground/5 font-mono text-[10px] font-semibold text-muted-foreground">
							{number}
						</span>
						{number !== "03" && <span className="mt-1 h-full w-px bg-border" />}
					</div>
					<div className="pb-2">
						<p className="text-sm font-semibold">{title}</p>
						<p className="mt-1 text-xs leading-5 text-muted-foreground">
							{description}
						</p>
					</div>
				</div>
			))}
		</>
	);
}
