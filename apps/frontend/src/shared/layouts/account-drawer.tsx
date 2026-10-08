import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { LogOut, Settings, Users } from "lucide-react";
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

	return (
		<Drawer
			open={isOpen}
			onOpenChange={() => setIsOpen(!isOpen)}
			swipeDirection="down"
		>
			<DrawerTrigger
				render={
					<button
						type="button"
						className="flex cursor-pointer min-h-14 flex-col items-center justify-center gap-1 text-muted-foreground"
					/>
				}
			>
				<Avatar className="size-6">
					<AvatarFallback className="bg-foreground text-background text-[9px] font-semibold">
						LD
					</AvatarFallback>
				</Avatar>

				<span className="text-[10px] font-medium">Cuenta</span>
			</DrawerTrigger>

			<DrawerContent>
				<DrawerHeader className="text-left">
					<div className="flex items-center gap-3">
						<Avatar className="size-11">
							<AvatarFallback className="bg-foreground text-background text-sm font-semibold">
								LD
							</AvatarFallback>
						</Avatar>

						<div className="flex flex-col">
							<DrawerTitle>Luisa Delgado</DrawerTitle>
							<DrawerDescription className={"text-sm"}>
								Administración
							</DrawerDescription>
						</div>
					</div>
				</DrawerHeader>

				<div className="p-4">
					<nav className="flex flex-col">
						<Link
							to="/workspace/$workspaceId/equipo"
							from="/workspace/$workspaceId"
							activeOptions={{ exact: true }}
							className={cn(
								buttonVariants({ size: "lg", variant: "ghost" }),
								"justify-start gap-3",
							)}
							activeProps={{
								className:
									"bg-primary text-primary-foreground font-semibold hover:text-primary-foreground hover:bg-primary! ",
							}}
							onClick={closeDrawer}
						>
							<Users className="size-4" />
							Equipo
						</Link>

						<Link
							to="/workspace/$workspaceId/configuracion"
							from="/workspace/$workspaceId"
							activeOptions={{ exact: true }}
							className={cn(
								buttonVariants({ size: "lg", variant: "ghost" }),
								"justify-start gap-3",
							)}
							activeProps={{
								className:
									"bg-primary text-primary-foreground font-semibold hover:text-primary-foreground hover:bg-primary! ",
							}}
							onClick={closeDrawer}
						>
							<Settings className="size-4" />
							Configuración
						</Link>

						<div className="my-2 border-t border-border" />

						<DrawerClose
							render={
								<Button
									variant={"ghost"}
									className="justify-start gap-3 text-destructive hover:text-destructive"
								/>
							}
							onClick={onSignOut}
						>
							<LogOut className="size-4" />
							Cerrar sesión
						</DrawerClose>
					</nav>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
