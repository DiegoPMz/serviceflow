import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import type { PropsWithChildren } from "react";

type MobileNavRoute = "inicio" | "clientes" | "equipo" | "configuracion";

export function MobileNavLink({
	children,
	route,
}: PropsWithChildren<{
	route: MobileNavRoute;
}>) {
	const suffix = route === "inicio" ? "" : `/${route}`;

	return (
		<Link
			from="/workspace/$workspaceId"
			to={`/workspace/$workspaceId${suffix}`}
			activeOptions={{ exact: true }}
			activeProps={{
				className:
					"bg-card text-card-foreground font-semibold shadow-sm shadow-card-foreground/5 ring-1 ring-sidebar-border",
			}}
			className={cn(
				"text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-xl",
				"text-[10px] font-medium transition-colors",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
			)}
		>
			{children}
		</Link>
	);
}
