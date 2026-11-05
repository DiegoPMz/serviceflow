import { cn } from "cn";
import type { ReactNode } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { CopyButton } from "./copy-button";

export function DetailCard({
	title,
	description,
	children,
	copyText,
	className,
}: {
	title: string;
	description?: string;
	children: ReactNode;
	copyText?: string;
	className?: string;
}) {
	return (
		<Card
			className={cn(
				"ring-1 ring-border/70 shadow-none animate-rise",
				className,
			)}
		>
			<CardHeader className="flex flex-row items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
				<div className="min-w-0 space-y-1">
					<CardTitle>{title}</CardTitle>

					{description && (
						<CardDescription className="text-xs">{description}</CardDescription>
					)}
				</div>

				{copyText !== undefined && <CopyButton text={copyText} />}
			</CardHeader>

			<CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
				<div className="border-t border-border/70 pt-4">{children}</div>
			</CardContent>
		</Card>
	);
}
