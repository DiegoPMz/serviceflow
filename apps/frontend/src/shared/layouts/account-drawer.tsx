import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { ChevronRight, LogOut, Settings, Users } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Button, buttonVariants } from "../components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "../components/ui/drawer";

type AccountDrawerProps = {
	onSignOut: () => void;
};

export function AccountDrawer({ onSignOut }: AccountDrawerProps) {
	const [isOpen, setIsOpen] = useState(false);

	const closeDrawer = () => setIsOpen(false);

	const navigationLinkClassName = cn(
		buttonVariants({ size: "lg", variant: "ghost" }),
		"h-12 w-full justify-start gap-3 rounded-xl px-3",
		"font-medium text-sidebar-foreground/70",
		"transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
	);

	return (
		<Drawer open={isOpen} onOpenChange={setIsOpen} swipeDirection="down">
			{/* Mobile navigation trigger */}
			<DrawerTrigger
				render={
					<button
						type="button"
						aria-label="Abrir menú de cuenta"
						className={cn(
							"flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-xl",
							"text-[10px] font-medium transition-colors",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
							isOpen
								? "bg-card font-semibold text-card-foreground shadow-sm ring-1 ring-sidebar-border"
								: "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
						)}
					/>
				}
			>
				<Avatar className="size-6">
					<AvatarFallback className="bg-foreground text-[9px] font-semibold text-background">
						LD
					</AvatarFallback>
				</Avatar>

				<span>Cuenta</span>
			</DrawerTrigger>

			{/* Account drawer */}
			<DrawerContent className="max-h-[85dvh] border-sidebar-border bg-sidebar text-sidebar-foreground">
				<DrawerHeader className="border-b border-sidebar-border px-5 pb-5 pt-3 text-left">
					<div className="flex items-center gap-3">
						<Avatar className="size-11 rounded-xl">
							<AvatarFallback className="rounded-xl bg-foreground text-sm font-semibold text-background">
								LD
							</AvatarFallback>
						</Avatar>

						<div className="min-w-0">
							<DrawerTitle className="text-base font-semibold tracking-tight">
								Luisa Delgado
							</DrawerTitle>

							<DrawerDescription className="mt-1 text-sm text-sidebar-foreground/60">
								Administración
							</DrawerDescription>
						</div>
					</div>
				</DrawerHeader>

				<div className="overflow-y-auto px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-5">
					<p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/50">
						Administración
					</p>

					<nav aria-label="Opciones de cuenta" className="flex flex-col gap-1">
						<Link
							to="/workspace/$workspaceId/equipo"
							from="/workspace/$workspaceId"
							activeOptions={{ exact: true }}
							className={navigationLinkClassName}
							activeProps={{
								className:
									"bg-card text-card-foreground font-semibold shadow-sm shadow-card-foreground/5 ring-1 ring-sidebar-border hover:bg-card",
							}}
							onClick={closeDrawer}
						>
							<span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
								<Users className="size-4" />
							</span>

							<span className="flex-1">Equipo</span>

							<ChevronRight className="size-4 text-sidebar-foreground/35" />
						</Link>

						<Link
							to="/workspace/$workspaceId/configuracion"
							from="/workspace/$workspaceId"
							activeOptions={{ exact: true }}
							className={navigationLinkClassName}
							activeProps={{
								className:
									"bg-card text-card-foreground font-semibold shadow-sm shadow-card-foreground/5 ring-1 ring-sidebar-border hover:bg-card",
							}}
							onClick={closeDrawer}
						>
							<span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
								<Settings className="size-4" />
							</span>

							<span className="flex-1">Configuración</span>

							<ChevronRight className="size-4 text-sidebar-foreground/35" />
						</Link>
					</nav>

					<div className="my-4 border-t border-sidebar-border" />

					<DrawerClose
						render={
							<Button
								type="button"
								variant="ghost"
								className={cn(
									"h-12 w-full justify-start gap-3 rounded-xl px-3",
									"text-destructive hover:bg-destructive/10 hover:text-destructive",
								)}
							/>
						}
						onClick={onSignOut}
					>
						<span className="grid size-8 shrink-0 place-items-center rounded-lg bg-destructive/10">
							<LogOut className="size-4" />
						</span>

						<span className="font-medium">Cerrar sesión</span>
					</DrawerClose>

					<p className="pt-5 text-center text-[11px] text-sidebar-foreground/45">
						ServiceFlow
					</p>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
