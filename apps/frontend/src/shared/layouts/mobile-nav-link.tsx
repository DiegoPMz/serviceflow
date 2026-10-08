import { Link } from "@tanstack/react-router";
import type { PropsWithChildren } from "react";

export function MobileNavLink({
	children,
	route,
}: PropsWithChildren<{
	route: "inicio" | "clientes" | "equipo" | "configuracion";
}>) {
	const rr = route !== "inicio" ? `/${route}` : "";

	return (
		<Link
			from="/workspace/$workspaceId"
			to={`/workspace/$workspaceId${rr}`}
			activeOptions={{ exact: true }}
			className="flex flex-col items-center gap-1 py-2.5 text-muted-foreground text-[11px] font-medium transition-colors focus-visible:outline-none"
			activeProps={{
				className: "font-semibold text-primary ",
			}}
		>
			{children}
		</Link>
	);
}
