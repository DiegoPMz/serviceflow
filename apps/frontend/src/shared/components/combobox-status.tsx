import { Button } from "@/shared/components/ui/button";

interface ComboboxStatusProps {
	isError: boolean;
	isFetching: boolean;
	isPending: boolean;
	hasMore: boolean;
	hasMoreMessage: string;
	onRetry: () => void;
}

export function ComboboxStatus({
	isError,
	isFetching,
	isPending,
	hasMore,
	hasMoreMessage,
	onRetry,
}: ComboboxStatusProps) {
	return (
		<>
			{isError && (
				<div className="border-t border-border p-1">
					<Button
						type="button"
						variant="destructive"
						size="sm"
						className="w-full text-center justify-center"
						onClick={onRetry}
					>
						Reintentar
					</Button>
				</div>
			)}

			{isFetching && !isPending && !isError && (
				<p className="border-t border-border px-2 py-1.5 text-[11px] text-muted-foreground">
					Buscando…
				</p>
			)}

			{hasMore && !isPending && !isError && (
				<p className="border-t border-border px-2 py-1.5 text-[11px] text-muted-foreground">
					{hasMoreMessage}
				</p>
			)}
		</>
	);
}
