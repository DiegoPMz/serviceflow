import { AccountMenu } from "./account-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";
import { ThemeToggle } from "./ui/theme-toggle";

export function MinimalHeader() {
	return (
		<header className="sticky w-full top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl sm:px-6">
			<div className="flex items-center gap-2.5">
				<Avatar className="size-8">
					<AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
						SF
					</AvatarFallback>
				</Avatar>
				<span className="font-display text-sm font-semibold">ServiceFlow</span>
			</div>
			<div className="flex items-center gap-2">
				<ThemeToggle />
				<AccountMenu />
			</div>
		</header>
	);
}

export function MinimalHeaderSkeleton() {
	return (
		<div
			className="mb-8 space-y-2.5"
			style={{ animation: "rise 600ms cubic-bezier(0.32,0.72,0,1) both" }}
		>
			<Skeleton className="h-3 w-14 bg-primary/20" />
			<Skeleton className="h-8 w-3/4 bg-muted-foreground/20" />
			<Skeleton className="h-4 w-5/6 bg-muted-foreground/10 mt-2" />
		</div>
	);
}
