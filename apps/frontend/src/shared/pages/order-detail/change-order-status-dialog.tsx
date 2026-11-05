import { AlertCircle, AlertTriangle } from "lucide-react";
import type { FinalOrderStatus } from "@/features/order/order-details";
import { IconContainer } from "@/shared/components/icon-container";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@/shared/components/ui/alert";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";

interface ChangeOrderStatusDialogProps {
	requestedStatus: FinalOrderStatus | null;
	folio: string;
	isUpdating: boolean;
	error: string | null;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}

export function ChangeOrderStatusDialog({
	requestedStatus,
	folio,
	isUpdating,
	error,
	onOpenChange,
	onConfirm,
}: ChangeOrderStatusDialogProps) {
	const isCancelling = requestedStatus === "cancelada";

	const confirmation =
		requestedStatus === "entregada"
			? {
					title: "¿Marcar la orden como entregada?",
					description: `La orden ${folio} pasará al estado Entregada. Este cambio es irreversible y no podrás devolverla a Pendiente.`,
				}
			: {
					title: "¿Cancelar esta orden?",
					description: `La orden ${folio} pasará al estado Cancelada. Este cambio es irreversible y no podrás reactivarla.`,
				};

	return (
		<AlertDialog
			open={requestedStatus !== null}
			onOpenChange={(open) => {
				if (!open && isUpdating) return;
				onOpenChange(open);
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<IconContainer
						className="size-9"
						iconClassName={"size-7 "}
						icon={AlertTriangle}
					/>

					<AlertDialogTitle>{confirmation.title}</AlertDialogTitle>

					<AlertDialogDescription>
						{confirmation.description}
					</AlertDialogDescription>
				</AlertDialogHeader>

				{error && (
					<Alert variant="destructive" className="py-3">
						<AlertCircle className="size-4" />
						<AlertTitle>No se pudo actualizar la orden</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<AlertDialogFooter className="bg-transparent">
					<AlertDialogCancel disabled={isUpdating}>Cancelar</AlertDialogCancel>

					<AlertDialogAction
						onClick={onConfirm}
						disabled={isUpdating}
						className={
							isCancelling
								? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
								: ""
						}
					>
						{isUpdating ? "Actualizando…" : "Confirmar"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
