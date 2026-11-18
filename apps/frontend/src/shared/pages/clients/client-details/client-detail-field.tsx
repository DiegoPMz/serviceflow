import { cn } from "cn";
import { Skeleton } from "@/shared/components/ui/skeleton";

type ClientDetailFieldProps = {
	icon: React.ReactNode;
	label: string;
	value?: string | null;
};

export function ClientDetailField({
	icon,
	label,
	value,
}: ClientDetailFieldProps) {
	return (
		<div className="flex min-w-0 items-start gap-2.5">
			<span className="mt-0.5 shrink-0 text-muted-foreground [&_svg]:size-4">
				{icon}
			</span>

			<div className="min-w-0">
				<p className="text-xs text-muted-foreground">{label}</p>

				<p
					className="mt-1 wrap-break-word text-sm font-medium text-card-foreground"
					title={value || undefined}
				>
					{value || "No registrado"}
				</p>
			</div>
		</div>
	);
}

export function ClientDetailFieldSkeleton({
	valueWidth,
}: {
	valueWidth: string;
}) {
	return (
		<div className="flex min-w-0 items-start gap-2.5">
			<Skeleton className="mt-0.5 size-4 shrink-0 rounded-sm" />

			<div className="min-w-0 flex-1 space-y-1.5">
				<Skeleton className="h-3 w-28 max-w-full" />
				<Skeleton className={cn("h-4 max-w-full", valueWidth)} />
			</div>
		</div>
	);
}
