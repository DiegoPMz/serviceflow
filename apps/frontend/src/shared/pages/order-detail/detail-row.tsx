import { cn } from "cn";
import type { ReactNode } from "react";

export function DetailRow({
	label,
	value,
	icon,
	className,
}: {
	label: string;
	value: ReactNode;
	icon?: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex min-w-0 items-start justify-between gap-4 py-3 first:pt-0",
				className,
			)}
		>
			<span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
				{icon}
				{label}
			</span>

			<span className="min-w-0 wrap-break-word text-right text-sm font-medium text-foreground">
				{value}
			</span>
		</div>
	);
}
