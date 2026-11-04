import { cn } from "cn";
import type { ReactNode } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";

export function BentoSection({
	number,
	title,
	description,
	className,
	children,
	action,
}: {
	number: string;
	title: string;
	description?: string;
	className?: string;
	children: ReactNode;
	action?: ReactNode;
}) {
	return (
		<Card className={cn("ring-1 ring-border/70 p-4 sm:p-5", className)}>
			<CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
				<div className="flex min-w-0 items-start gap-3">
					<span className="flex text-lg font-semibold bg-muted/30 ring-1 ring-border/70 text-muted-foreground size-8 rounded-sm aspect-square items-center justify-center ">
						{number}
					</span>
					<div className="min-w-0 space-y-1">
						<CardTitle>{title}</CardTitle>
						{description && (
							<CardDescription className="text-xs leading-5">
								{description}
							</CardDescription>
						)}
					</div>
				</div>
				{action}
			</CardHeader>
			<CardContent className="pt-4 border-t border-muted">
				{children}
			</CardContent>
		</Card>
	);
}
