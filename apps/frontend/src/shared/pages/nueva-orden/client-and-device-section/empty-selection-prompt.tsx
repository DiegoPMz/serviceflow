import { SquareDashedMousePointerIcon } from "lucide-react";
import { IconContainer } from "@/shared/components/icon-container";

export function EmptySelectionPrompt({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-muted/10 p-3">
			<IconContainer className="size-9" icon={SquareDashedMousePointerIcon} />

			<div className="min-w-0 space-y-1 pt-0.5">
				<p className="text-sm font-medium">{title}</p>
				<p className="text-xs leading-relaxed text-muted-foreground">
					{description}
				</p>
			</div>
		</div>
	);
}
