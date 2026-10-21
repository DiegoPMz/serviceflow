import { cn } from "cn";
import { type ReactNode, useEffect, useState } from "react";

type PresenceProps = {
	/** Controla si el contenido debe estar visible. */
	show: boolean;
	children: ReactNode;
	/** Duración de la transición en ms (debe coincidir con el retardo de desmontaje). */
	duration?: number;
	className?: string;
	innerClassName?: string;
};

/**
 * Mantiene el contenido montado durante su salida para poder animar el fade
 * y el colapso de altura, evitando que el layout pegue un salto.
 *
 * Técnica: `grid-template-rows: 1fr -> 0fr` sobre un hijo `overflow-hidden`
 * con `min-h-0` (sin él, el mínimo automático del grid impide el colapso).
 */
export function Presence({
	show,
	children,
	duration = 300,
	className,
	innerClassName,
}: PresenceProps) {
	const [render, setRender] = useState(show);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (show) {
			setRender(true);
			// Siguiente frame: parte de colapsado y transiciona a abierto.
			const frame = requestAnimationFrame(() => setOpen(true));
			return () => cancelAnimationFrame(frame);
		}

		setOpen(false);
		const timer = setTimeout(() => setRender(false), duration);
		return () => clearTimeout(timer);
	}, [show, duration]);

	if (!render) {
		return null;
	}

	return (
		<div
			data-state={open ? "open" : "closed"}
			style={{ transitionDuration: `${duration}ms` }}
			className={cn(
				"grid transition-[grid-template-rows,opacity] ease-out",
				open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
				"motion-reduce:transition-none",
				className,
			)}
		>
			<div className={cn("min-h-0 overflow-hidden", innerClassName)}>
				{children}
			</div>
		</div>
	);
}
