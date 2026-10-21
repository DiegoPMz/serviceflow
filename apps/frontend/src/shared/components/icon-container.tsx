import { cn } from "cn";
import type { LucideIcon } from "lucide-react";

interface IconContainerProps {
	icon: LucideIcon;
	className?: string;
	iconClassName?: string;
}

export function IconContainer({
	icon: Icon,
	className,
	iconClassName,
}: IconContainerProps) {
	return (
		<div
			aria-hidden="true"
			className={cn(
				"grid size-6.5 shrink-0 place-items-center rounded-sm outline-2 outline-muted/50 bg-muted/10 text-muted-foreground/50",
				className,
			)}
		>
			<Icon className={cn("size-4.5", iconClassName)} />
		</div>
	);
}
