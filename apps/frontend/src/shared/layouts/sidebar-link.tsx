import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import type { PropsWithChildren } from "react";
import { buttonVariants } from "../components/ui/button";

export function SidebarLink({
	children,
	route,
}: PropsWithChildren<{
	route: "inicio" | "clientes" | "equipo" | "configuracion";
}>) {
	const suffix = route === "inicio" ? "" : `/${route}`;

	return (
		<Link
			from="/workspace/$workspaceId"
			to={`/workspace/$workspaceId${suffix}`}
			activeOptions={{ exact: route === "inicio" }}
			className={cn(
				buttonVariants({ size: "lg", variant: "ghost" }),
				"h-11 w-full justify-start gap-3 rounded-xl px-3 font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
			)}
			activeProps={{
				className:
					"bg-card text-card-foreground font-semibold shadow-sm shadow-card-foreground/5 ring-1 ring-sidebar-border hover:bg-card",
			}}
		>
			{children}
		</Link>
	);
}
