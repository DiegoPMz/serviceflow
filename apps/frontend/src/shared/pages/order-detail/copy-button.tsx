import { Check, Copy } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useCopyToClipboard } from "./use-copy-to-clipboard.hook";

export function CopyButton({ text }: { text: string }) {
	const { copyState, copy } = useCopyToClipboard();

	return (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			onClick={() => void copy(text)}
			disabled={!text.trim()}
			className="h-8 shrink-0 gap-1.5 px-2 text-xs text-muted-foreground"
			aria-label="Copiar información"
		>
			{copyState === "copied" ? (
				<Check className="size-3.5" />
			) : (
				<Copy className="size-3.5" />
			)}

			<span>
				{copyState === "copied"
					? "Copiado"
					: copyState === "error"
						? "Error al copiar"
						: "Copiar"}
			</span>
		</Button>
	);
}
