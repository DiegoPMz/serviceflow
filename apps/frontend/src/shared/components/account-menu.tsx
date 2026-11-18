import { useClerk, useUser } from "@clerk/react";
import { cn } from "cn";
import { LogOut } from "lucide-react";
import { createContext, type ReactNode, use } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface AccountMenuContextType {
	user: ReturnType<typeof useUser>["user"];
}

const AccountMenuContext = createContext<AccountMenuContextType | null>(null);

function useAccountMenuContext() {
	const context = use(AccountMenuContext);
	if (!context) {
		throw new Error(
			"Los subcomponentes de AccountMenu deben usarse dentro de <AccountMenu />",
		);
	}
	return context;
}

export function AccountMenu({
	onSignOut,
	className,
	children,
}: {
	onSignOut?: () => void;
	className?: string;
	children?: ReactNode;
}) {
	const { isLoaded, isSignedIn, user } = useUser();
	const { signOut } = useClerk();

	if (!isLoaded || !isSignedIn) {
		return (
			<Button
				variant="secondary"
				size="icon"
				className={cn("rounded-full animate-pulse bg-muted", className)}
				disabled
			/>
		);
	}

	const handleSignOut = async () => {
		if (onSignOut) onSignOut();
		await signOut();
	};

	const initials =
		user.firstName && user.lastName
			? `${user.firstName}${user.lastName}`.toUpperCase()
			: user.username?.substring(0, 2).toUpperCase() || "U";

	return (
		<AccountMenuContext.Provider value={{ user }}>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							variant="outline"
							size={!children ? "icon" : "default"}
							className={cn(
								"rounded-full",
								children &&
									"rounded-lg h-fit w-full flex items-center justify-start border border-border gap-2 p-2",
							)}
						>
							<Avatar>
								<AvatarImage
									src={user.imageUrl}
									alt={user.fullName || "Usuario"}
								/>
								<AvatarFallback>{initials}</AvatarFallback>
							</Avatar>

							{children}
						</Button>
					}
				/>

				<DropdownMenuContent side="top" align="start" className="w-60">
					<DropdownMenuGroup>
						<DropdownMenuLabel>
							<div className="flex flex-col gap-1">
								<span className="font-semibold truncate">{user.fullName}</span>
								<span className="font-normal text-xs text-muted-foreground truncate">
									{user.primaryEmailAddress?.emailAddress}
								</span>
							</div>
						</DropdownMenuLabel>

						<DropdownMenuSeparator />

						<DropdownMenuItem
							className="text-destructive focus:text-destructive cursor-pointer"
							onClick={handleSignOut}
						>
							<LogOut className="mr-2 size-4" />
							Cerrar sesión
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</AccountMenuContext.Provider>
	);
}

AccountMenu.UserName = function AccountMenuUserName() {
	const { user } = useAccountMenuContext();
	return <>{user?.fullName}</>;
};

AccountMenu.Email = function AccountMenuEmail() {
	const { user } = useAccountMenuContext();
	return <>{user?.primaryEmailAddress?.emailAddress}</>;
};
