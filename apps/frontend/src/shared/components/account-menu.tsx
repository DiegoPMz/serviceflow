import { Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function AccountMenu({ onSignOut }: { onSignOut?: () => void }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<button
						type="button"
						aria-label="Cuenta de usuario"
						className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<Avatar className="size-8">
							<AvatarFallback className="bg-foreground text-background text-xs">
								LD
							</AvatarFallback>
						</Avatar>
					</button>
				}
			/>

			<DropdownMenuContent align="end">
				<DropdownMenuGroup>
					<DropdownMenuLabel>Luisa Delgado</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem>
						<Settings className="size-4" /> Perfil
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						className="text-destructive focus:text-destructive"
						onClick={onSignOut}
					>
						Cerrar sesión
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
