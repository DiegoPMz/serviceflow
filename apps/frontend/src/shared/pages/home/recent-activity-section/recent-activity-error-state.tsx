import { cn } from "cn";
import { CloudOff, RefreshCw } from "lucide-react";
import { IconContainer } from "@/shared/components/icon-container";
import { Button } from "@/shared/components/ui/button";

export function RecentActivityErrorState({
	onRetry,
	isRetrying,
}: {
	onRetry: () => void;
	isRetrying: boolean;
}) {
	return (
		<div className="mt-5 w-full h-full flex flex-col justify-center items-center rounded-lg border border-border/70 bg-muted/20 px-4 py-8 text-center">
			<IconContainer
				className="size-10 text-destructive"
				iconClassName="size-6 "
				icon={CloudOff}
			></IconContainer>

			<h3 className="mt-2 text-sm font-semibold tracking-tight">
				No pudimos cargar la actividad reciente.
			</h3>

			<p className="mt-1 max-w-sm text-xs leading-6 text-muted-foreground">
				Inténtalo de nuevo en unos momentos.
			</p>

			<Button
				className="mt-3"
				variant="outline"
				size="sm"
				onClick={onRetry}
				disabled={isRetrying}
			>
				<RefreshCw
					className={cn("mr-2 size-4", isRetrying && "animate-spin")}
				/>
				{isRetrying ? "Reintentando..." : "Reintentar"}
			</Button>
		</div>
	);
}
