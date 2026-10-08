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
	return (
		<Link
			to={`/ws/$workspaceId/${route}`}
			from="/ws/$workspaceId"
			activeProps={{
				className: "bg-primary font-semibold text-primary-foreground",
			}}
			className={cn(buttonVariants({ size: "lg", variant: "ghost" }))}
		>
			{children}
		</Link>
	);
}
