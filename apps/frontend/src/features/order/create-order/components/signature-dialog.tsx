import { Check, Eraser, Trash2 } from "lucide-react";
import {
	type PointerEvent as ReactPointerEvent,
	useEffect,
	useRef,
	useState,
} from "react";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 300;

type SignatureDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialSignature: string | null;
	onSave: (signature: string) => void;
};

export function SignatureDialog({
	open,
	onOpenChange,
	initialSignature,
	onSave,
}: SignatureDialogProps) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const drawingRef = useRef(false);
	const [hasDrawn, setHasDrawn] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!open) {
			return;
		}

		const frame = requestAnimationFrame(() => {
			const canvas = canvasRef.current;
			const context = canvas?.getContext("2d");

			if (!canvas || !context) {
				return;
			}

			context.clearRect(0, 0, canvas.width, canvas.height);
			context.lineCap = "round";
			context.lineJoin = "round";
			context.lineWidth = 4;
			context.strokeStyle = "#1e293b";
			setHasDrawn(false);
			setError(null);

			if (!initialSignature) {
				return;
			}

			const image = new Image();
			image.onload = () => {
				context.drawImage(image, 0, 0, canvas.width, canvas.height);
				setHasDrawn(true);
			};
			image.src = initialSignature;
		});

		return () => cancelAnimationFrame(frame);
	}, [open, initialSignature]);

	function getPoint(event: ReactPointerEvent<HTMLCanvasElement>) {
		const canvas = event.currentTarget;
		const rect = canvas.getBoundingClientRect();

		return {
			x: ((event.clientX - rect.left) / rect.width) * canvas.width,
			y: ((event.clientY - rect.top) / rect.height) * canvas.height,
		};
	}

	function startDrawing(event: ReactPointerEvent<HTMLCanvasElement>) {
		const canvas = event.currentTarget;
		const context = canvas.getContext("2d");

		if (!context) {
			return;
		}

		const point = getPoint(event);
		canvas.setPointerCapture(event.pointerId);
		context.beginPath();
		context.moveTo(point.x, point.y);
		context.lineCap = "round";
		context.lineJoin = "round";
		context.lineWidth = 4;
		context.strokeStyle = "#1e293b";
		drawingRef.current = true;
		setHasDrawn(true);
		setError(null);
	}

	function draw(event: ReactPointerEvent<HTMLCanvasElement>) {
		if (!drawingRef.current) {
			return;
		}

		const context = event.currentTarget.getContext("2d");

		if (!context) {
			return;
		}

		const point = getPoint(event);
		context.lineTo(point.x, point.y);
		context.stroke();
	}

	function stopDrawing(event: ReactPointerEvent<HTMLCanvasElement>) {
		drawingRef.current = false;

		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
	}

	function clearCanvas() {
		const canvas = canvasRef.current;
		const context = canvas?.getContext("2d");

		if (!canvas || !context) {
			return;
		}

		context.clearRect(0, 0, canvas.width, canvas.height);
		setHasDrawn(false);
		setError(null);
	}

	function saveSignature() {
		const canvas = canvasRef.current;

		if (!canvas || !hasDrawn) {
			setError("Captura la firma antes de guardarla.");
			return;
		}

		onSave(canvas.toDataURL("image/png"));
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Firma de conformidad</DialogTitle>

					<DialogDescription>
						Dibuja la firma del cliente dentro del recuadro.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3">
					<div className="overflow-hidden rounded-xl border border-border bg-white">
						<canvas
							ref={canvasRef}
							width={CANVAS_WIDTH}
							height={CANVAS_HEIGHT}
							aria-label="Área para capturar la firma"
							onPointerDown={startDrawing}
							onPointerMove={draw}
							onPointerUp={stopDrawing}
							onPointerCancel={stopDrawing}
							className="block h-52 w-full cursor-crosshair touch-none"
						/>
					</div>

					<p className="text-xs text-muted-foreground">
						Usa el dedo, el mouse o un lápiz digital.
					</p>

					{error && (
						<p role="alert" className="text-xs text-destructive">
							{error}
						</p>
					)}
				</div>

				<DialogFooter className="bg-transparent">
					<div className="flex gap-2">
						<Button
							className="flex-1"
							type="button"
							disabled={!hasDrawn}
							variant="secondary"
							onClick={clearCanvas}
						>
							<Eraser className="size-4" /> Borrar
						</Button>
						<Button
							className="flex-1"
							type="button"
							disabled={!hasDrawn}
							onClick={saveSignature}
						>
							<Check className="size-4" /> Guardar firma
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
