import { SquareDashedMousePointerIcon } from "lucide-react";
import { IconContainer } from "@/shared/components/icon-container";

export function LockedPrompt({ message }: { message: string }) {
	return (
		<div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-muted/10 p-3">
			<IconContainer className="size-9" icon={SquareDashedMousePointerIcon} />

			<p className="min-w-0 pt-0.5 text-xs leading-relaxed text-muted-foreground">
				{message}
			</p>
		</div>
	);
}
