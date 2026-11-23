import { cn } from "cn";
import { AlertCircle, RefreshCw } from "lucide-react";
import { IconContainer } from "@/shared/components/icon-container";
import { Button } from "@/shared/components/ui/button";

interface TeamSectionErrorProps {
	title: string;
	description: string;
	onRetry: () => void;
}

export function TeamSectionError({
	title,
	description,
	onRetry,
}: TeamSectionErrorProps) {
	return (
		<div
			role="alert"
			className="flex flex-col items-center justify-center rounded-xl border border-border/70 bg-card p-6 text-center"
		>
			<IconContainer
				className="size-10"
				iconClassName="text-destructive size-7"
				icon={AlertCircle}
			/>

			<p className="mt-4 text-sm font-semibold">{title}</p>

			<p className="mt-1 max-w-xs text-xs text-muted-foreground">
				{description}
			</p>

			<Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
				<RefreshCw className="size-3.5" />
				Reintentar
			</Button>
		</div>
	);
}

interface TeamSectionErrorNoticeProps {
	title: string;
	description: string;
	onRetry: () => void;
	className?: string;
}

export function TeamSectionErrorNotice({
	title,
	description,
	onRetry,
	className,
}: TeamSectionErrorNoticeProps) {
	return (
		<div
			role="alert"
			className={cn(
				"flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/30 p-3",
				className,
			)}
		>
			<div className="flex min-w-0 items-start gap-2.5">
				<AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive/70" />

				<div className="min-w-0">
					<p className="text-xs font-medium">{title}</p>

					<p className="mt-0.5 text-[11px] text-muted-foreground">
						{description}
					</p>
				</div>
			</div>

			<Button
				variant="ghost"
				size="sm"
				className="h-8 shrink-0 px-2"
				onClick={onRetry}
			>
				<RefreshCw className="size-3.5" />
				Reintentar
			</Button>
		</div>
	);
}
