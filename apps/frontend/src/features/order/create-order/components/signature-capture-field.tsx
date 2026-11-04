import { useSelector } from "@tanstack/react-form";
import { CheckCircle2, EllipsisVertical, PenLine, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/shared/components/ui/field";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/shared/components/ui/popover";
import { useFieldContext } from "../create-order.form";
import { SignatureDialog } from "./signature-dialog";

export function SignatureCaptureField() {
	const field = useFieldContext<string | null>();

	const value = useSelector(field.store, (state) => state.value);
	const errors = useSelector(field.store, (state) => state.meta.errors);

	const [dialogOpen, setDialogOpen] = useState(false);

	const [signatureActionsOpen, setSignatureActionsOpen] = useState(false);

	function saveSignature(signature: string) {
		field.handleChange(signature);
		field.handleBlur();
		setDialogOpen(false);
	}

	function removeSignature() {
		field.handleChange(null);
		field.handleBlur();
	}

	return (
		<Field className="min-h-full" data-invalid={errors.length > 0}>
			<FieldLabel>Firma de conformidad</FieldLabel>

			{value ? (
				<div className="flex aspect-3/2 max-h-70 w-full flex-col overflow-hidden rounded-xl border border-border bg-card">
					<div className="relative flex min-h-0 flex-1 items-center justify-center bg-white p-3">
						<img
							src={value}
							alt="Firma de conformidad del cliente"
							className="max-h-full max-w-full object-contain"
						/>

						<div className="absolute right-2 top-2 z-10">
							<Popover
								open={signatureActionsOpen}
								onOpenChange={setSignatureActionsOpen}
							>
								<PopoverTrigger
									render={
										<Button
											type="button"
											variant="outline"
											size="icon-lg"
											aria-label="Acciones de la firma"
											className="dark:border-border/101"
										/>
									}
								>
									<EllipsisVertical className="size-4 text-muted-foreground dark:text-muted" />
								</PopoverTrigger>

								<PopoverContent
									align="end"
									side="bottom"
									className="w-48 p-1.5"
								>
									<div className="flex flex-col gap-1">
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="w-full justify-start"
											onClick={() => {
												setSignatureActionsOpen(false);
												setDialogOpen(true);
											}}
										>
											<PenLine className="size-4" />
											Editar firma
										</Button>

										<div className="mt-1 border-t border-border pt-1">
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="w-full justify-start text-destructive hover:text-destructive"
												onClick={() => {
													setSignatureActionsOpen(false);
													removeSignature();
												}}
											>
												<Trash2 className="size-4" />
												Eliminar firma
											</Button>
										</div>
									</div>
								</PopoverContent>
							</Popover>
						</div>
					</div>

					<div className="flex shrink-0 items-center border-t border-border p-3">
						<span className="flex items-center gap-1.5 text-[10px] text-muted-foreground ">
							<CheckCircle2 className="size-3.5 text-success" />
							Firma guardada
						</span>
					</div>
				</div>
			) : (
				<button
					type="button"
					onClick={() => setDialogOpen(true)}
					className="flex aspect-3/2 max-h-70 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-4 text-center transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<div className="flex flex-col items-center">
						<span className="grid p-1 place-content-center rounded-sm bg-primary text-primary-foreground">
							<PenLine className="size-5" />
						</span>

						<span className="mt-2 text-[11px] text-muted-foreground">
							Dedo, mouse o stylus
						</span>
					</div>
				</button>
			)}

			<FieldError className="text-xs" errors={[errors[0]]} />

			<SignatureDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				initialSignature={value}
				onSave={saveSignature}
			/>
		</Field>
	);
}
