import { useCallback, useState } from "react";
import { toast } from "sonner";

export function useOrderShare(folio: string) {
	const [isSharing, setIsSharing] = useState(false);

	const shareOrder = useCallback(async () => {
		if (isSharing) return;

		setIsSharing(true);

		try {
			const url = window.location.href;
			const shareData = {
				title: `Orden ${folio}`,
				text: `Consulta el detalle de la orden ${folio}.`,
				url,
			};

			if (typeof navigator.share === "function") {
				try {
					await navigator.share(shareData);
					return;
				} catch (error) {
					if (error instanceof DOMException && error.name === "AbortError") {
						return;
					}
				}
			}

			try {
				await navigator.clipboard.writeText(url);
				toast.success("Enlace de la orden copiado");
			} catch {
				toast.error("No pudimos compartir el enlace de la orden");
			}
		} finally {
			setIsSharing(false);
		}
	}, [folio, isSharing]);

	return { isSharing, shareOrder };
}
