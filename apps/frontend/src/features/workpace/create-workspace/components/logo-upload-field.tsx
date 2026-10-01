import { useSelector } from "@tanstack/react-form";
import { cn } from "cn";
import { Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	Attachment,
	AttachmentAction,
	AttachmentActions,
	AttachmentContent,
	AttachmentDescription,
	AttachmentMedia,
	AttachmentTitle,
} from "@/shared/components/ui/attachment";
import { Button } from "@/shared/components/ui/button";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@/shared/components/ui/field";
import { useFieldContext } from "../create-workspace.form";

interface LogoUploadFieldProps {
	disabled?: boolean;
}

export function LogoUploadField({ disabled = false }: LogoUploadFieldProps) {
	const field = useFieldContext<File | null>();

	const errors = useSelector(field.store, (state) => state.meta.errors);
	const isTouched = useSelector(field.store, (state) => state.meta.isTouched);
	const value = useSelector(field.store, (state) => state.value);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	const hasError = isTouched && errors.length > 0;

	useEffect(() => {
		if (!value) {
			setPreviewUrl(null);
			return;
		}

		const url = URL.createObjectURL(value);
		setPreviewUrl(url);

		return () => {
			URL.revokeObjectURL(url);
		};
	}, [value]);

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0] ?? null;

		field.handleChange(file);
		field.handleBlur();
	};

	const handleRemove = () => {
		field.handleChange(null);

		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleClick = () => {
		if (!disabled) {
			fileInputRef.current?.click();
		}
	};

	return (
		<Field data-invalid={hasError}>
			<FieldLabel htmlFor={field.name}>Logotipo</FieldLabel>

			<FieldContent>
				<FieldDescription className="text-xs">
					Agrega el logotipo que aparecerá en documentos y comunicaciones de la
					empresa.
				</FieldDescription>

				{value && previewUrl ? (
					<Attachment
						size="default"
						className={cn(hasError && "border-destructive")}
					>
						<AttachmentMedia variant="image">
							<img
								src={previewUrl}
								alt="Vista previa del logotipo"
								className="size-full object-contain"
							/>
						</AttachmentMedia>

						<AttachmentContent>
							<AttachmentTitle className="truncate">
								{value.name}
							</AttachmentTitle>

							<AttachmentDescription>
								{(value.size / 1024).toFixed(0)} KB
							</AttachmentDescription>
						</AttachmentContent>

						<AttachmentActions>
							<AttachmentAction
								type="button"
								aria-label="Eliminar logotipo"
								onClick={handleRemove}
								disabled={disabled}
							>
								<Trash2 />
							</AttachmentAction>
						</AttachmentActions>
					</Attachment>
				) : (
					<Button
						type="button"
						variant={"outline"}
						className={cn(
							"grid min-h-32 place-items-center content-center gap-1 rounded-md border-dashed border-input bg-card text-muted-foreground",
							"hover:border-foreground hover:bg-muted",
							disabled && "cursor-not-allowed opacity-50",
							hasError && "border-destructive ",
						)}
						onClick={handleClick}
						disabled={disabled}
						aria-invalid={hasError}
						aria-describedby={hasError ? `${field.name}-error` : undefined}
					>
						<Upload />

						<strong className="text-xs text-foreground">Subir logotipo</strong>

						<span className="font-mono text-[10px]">
							PNG o JPG · máximo 1 MB
						</span>
					</Button>
				)}

				<input
					ref={fileInputRef}
					id={field.name}
					name={field.name}
					type="file"
					accept="image/png,image/jpeg,image/svg+xml"
					onChange={handleInputChange}
					onBlur={field.handleBlur}
					className="sr-only"
					disabled={disabled}
				/>

				{hasError && <FieldError className="text-xs" errors={errors} />}

				{value && !hasError && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="justify-start text-left text-xs text-muted-foreground underline hover:text-foreground"
						onClick={handleClick}
						disabled={disabled}
					>
						Cambiar archivo
					</Button>
				)}
			</FieldContent>
		</Field>
	);
}
