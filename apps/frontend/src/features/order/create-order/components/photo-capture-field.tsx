import { useSelector } from "@tanstack/react-form";
import {
	Camera,
	CheckCircle2,
	EllipsisVertical,
	ImagePlus,
	Trash2,
	Upload,
} from "lucide-react";
import { type PropsWithChildren, useEffect, useRef, useState } from "react";
import * as v from "valibot";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/shared/components/ui/field";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/shared/components/ui/popover";
import { useFieldContext } from "../create-order.form";
import {
	ORDER_PHOTO_MIME_TYPES,
	OrderPhotoFileSchema,
} from "../create-order.schema";

export function PhotoCaptureField() {
	const field = useFieldContext<File | null>();

	const value = useSelector(field.store, (state) => state.value);
	const errors = useSelector(field.store, (state) => state.meta.errors);
	const isTouched = useSelector(field.store, (state) => state.meta.isTouched);

	const cameraInputRef = useRef<HTMLInputElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [photoError, setPhotoError] = useState<string | null>(null);

	const [photoActionsOpen, setPhotoActionsOpen] = useState(false);

	useEffect(() => {
		if (!value) {
			setPreviewUrl(null);
			return;
		}

		const url = URL.createObjectURL(value);
		setPreviewUrl(url);

		return () => URL.revokeObjectURL(url);
	}, [value]);

	const hasError = Boolean(photoError) || (isTouched && errors.length > 0);

	function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const input = event.currentTarget;
		const file = input.files?.[0] ?? null;
		input.value = "";

		if (!file) return;

		const result = v.safeParse(OrderPhotoFileSchema, file);

		if (!result.success) {
			setPhotoError(
				result.issues[0]?.message ?? "Selecciona una imagen válida.",
			);
			return;
		}

		setPhotoError(null);
		field.handleChange(file);
		field.handleBlur();
	}

	function removePhoto() {
		setPhotoError(null);
		field.handleChange(null);
		field.handleBlur();

		setPhotoActionsOpen(false);
	}

	return (
		<Field data-invalid={hasError}>
			<FieldLabel>Fotografía del equipo</FieldLabel>

			{value && previewUrl ? (
				<div className="flex aspect-3/2 max-h-70 w-full flex-col overflow-hidden rounded-xl border border-border bg-card p-3">
					<div className="relative flex min-h-0 flex-1 items-center justify-center py-1">
						<img
							src={previewUrl}
							alt="Vista previa del dispositivo"
							className="max-h-full max-w-full rounded-sm object-cover"
						/>

						<div className="absolute right-0 top-0 z-10">
							<Popover
								open={photoActionsOpen}
								onOpenChange={setPhotoActionsOpen}
							>
								<PopoverTrigger
									render={
										<Button
											type="button"
											variant="outline"
											size="icon-lg"
											className="bg-background/90"
											aria-label="Acciones de la fotografía"
										/>
									}
								>
									<EllipsisVertical className="size-4" />
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
												setPhotoActionsOpen(false);
												cameraInputRef.current?.click();
											}}
										>
											<Camera className="size-4" />
											Tomar otra foto
										</Button>

										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="w-full justify-start"
											onClick={() => {
												setPhotoActionsOpen(false);
												fileInputRef.current?.click();
											}}
										>
											<Upload className="size-4" />
											Elegir otra imagen
										</Button>

										<div className="mt-1 border-t border-border pt-1">
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="w-full justify-start text-destructive hover:text-destructive"
												onClick={() => {
													setPhotoActionsOpen(false);
													removePhoto();
												}}
											>
												<Trash2 className="size-4" />
												Eliminar fotografía
											</Button>
										</div>
									</div>
								</PopoverContent>
							</Popover>
						</div>
					</div>

					<div className="flex shrink-0 items-center justify-center pt-2">
						<span className="flex min-w-0 w-full items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
							<CheckCircle2 className="size-3.5 shrink-0 text-success" />

							<span className="min-w-0 truncate">
								{value.name} · {formatFileSize(value.size)}
							</span>
						</span>
					</div>
				</div>
			) : (
				<>
					<div className="aspect-3/2 max-h-70 w-full flex flex-col gap-3 items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-4 lg:hidden">
						<div className="flex flex-col items-center sm:flex-row sm:gap-3">
							<div className="grid place-items-center p-1 bg-primary rounded-sm text-primary-foreground">
								<ImagePlus className="size-6" />
							</div>
							<span className="mt-2 text-[11px]  text-muted-foreground">
								JPG, PNG, WEBP o GIF · máximo 1 MB
							</span>
						</div>

						<div className="flex flex-row flex-wrap items-center justify-center gap-2 ">
							<Button
								type="button"
								variant="outline"
								size="lg"
								className="w-full"
								onClick={() => cameraInputRef.current?.click()}
							>
								<Camera />
								Tomar foto
							</Button>

							<Button
								type="button"
								size="lg"
								variant="outline"
								className="w-full"
								onClick={() => fileInputRef.current?.click()}
							>
								<Upload /> Elegir archivo
							</Button>
						</div>
					</div>

					<DesktopActions className="hidden lg:block">
						<div className="flex flex-col">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="w-full justify-start"
								onClick={() => cameraInputRef.current?.click()}
							>
								<Camera />
								Tomar foto
							</Button>

							<div className="mt-1 border-t border-border pt-1">
								<Button
									type="button"
									size="sm"
									variant="ghost"
									className="w-full justify-start"
									onClick={() => fileInputRef.current?.click()}
								>
									<Upload /> Elegir archivo
								</Button>
							</div>
						</div>
					</DesktopActions>
				</>
			)}

			<input
				ref={cameraInputRef}
				type="file"
				accept={ORDER_PHOTO_MIME_TYPES.join(",")}
				capture="environment"
				tabIndex={-1}
				aria-hidden="true"
				className="sr-only"
				onChange={handleFileChange}
			/>

			<input
				ref={fileInputRef}
				type="file"
				accept={ORDER_PHOTO_MIME_TYPES.join(",")}
				tabIndex={-1}
				aria-hidden="true"
				className="sr-only"
				onChange={handleFileChange}
			/>

			{photoError ? (
				<p role="alert" className="text-xs text-destructive">
					{photoError}
				</p>
			) : (
				<FieldError className="text-xs" errors={[errors[0]]} />
			)}
		</Field>
	);
}

function formatFileSize(bytes: number) {
	if (bytes < 1024) {
		return `${bytes} B`;
	}

	if (bytes < 1024 * 1024) {
		return `${Math.round(bytes / 1024)} KB`;
	}

	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DesktopActions({
	children,
	className,
}: PropsWithChildren<{ className?: string }>) {
	return (
		<Popover>
			<PopoverTrigger
				render={
					<button type="button" className={className}>
						<div className="aspect-3/2 max-h-70 w-full flex flex-col gap-3 items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-4">
							<div className="flex flex-col items-center ">
								<div className="grid place-items-center p-1 bg-primary rounded-sm text-primary-foreground">
									<ImagePlus className="size-6" />
								</div>
								<span className="mt-2 text-[11px]  text-muted-foreground">
									JPG o PNG · máximo 1 MB
								</span>
							</div>
						</div>
					</button>
				}
			/>
			<PopoverContent align="end" side="bottom" className="w-48 p-1.5">
				{children}
			</PopoverContent>
		</Popover>
	);
}
