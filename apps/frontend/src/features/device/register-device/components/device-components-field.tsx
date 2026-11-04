import { useSelector } from "@tanstack/react-form";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import { useFieldContext } from "../register-device.form";
import type { DeviceComponentInput } from "../register-device.schema";

const COMPONENT_TYPE_OPTIONS: {
	value: DeviceComponentInput["type"];
	label: string;
}[] = [
	{ value: "supply", label: "Consumible" },
	{ value: "replacement_part", label: "Repuesto" },
	{ value: "other", label: "Otro" },
];

interface DeviceComponentsFieldProps {
	disabled?: boolean;
}

export function DeviceComponentsField({
	disabled = false,
}: DeviceComponentsFieldProps) {
	const field = useFieldContext<DeviceComponentInput[]>();

	const components = useSelector(field.store, (state) => state.value);
	const errors = useSelector(field.store, (state) => state.meta.errors);
	const isTouched = useSelector(field.store, (state) => state.meta.isTouched);

	const nextKey = useRef(0);
	const rowKeys = useRef<string[]>([]);

	useEffect(() => {
		while (rowKeys.current.length < components.length) {
			rowKeys.current.push(String(nextKey.current++));
		}

		if (rowKeys.current.length > components.length) {
			rowKeys.current.length = components.length;
		}
	}, [components.length]);

	const hasError = isTouched && errors.length > 0;

	const addComponent = () => {
		rowKeys.current.push(String(nextKey.current++));

		field.pushValue({
			name: "",
			partNumber: "",
			type: "supply",
		});
	};

	const updateComponent = (
		index: number,
		patch: Partial<DeviceComponentInput>,
	) => {
		const component = components[index];

		if (!component) {
			return;
		}

		field.replaceValue(index, { ...component, ...patch });
	};

	const removeComponent = (index: number) => {
		rowKeys.current.splice(index, 1);

		field.removeValue(index);
	};

	return (
		<Field className="pt-2" data-invalid={hasError}>
			<FieldContent>
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="space-y-2">
						<FieldLabel className="flex items-center">
							Componentes
							<Badge
								variant={"outline"}
								className="text-[10px] font-medium text-muted-foreground"
							>
								Opcional
							</Badge>
						</FieldLabel>
						<FieldDescription className="text-xs">
							Registra consumibles o repuestos del equipo.
						</FieldDescription>
					</div>

					<Button
						type="button"
						variant="outline"
						size="sm"
						className={"w-full"}
						onClick={addComponent}
						disabled={disabled}
					>
						<Plus />
						Agregar componente
					</Button>
				</div>

				{components.length > 0 && (
					<FieldGroup className="gap-3 mt-4">
						{components.map((component, index) => (
							<Card
								key={rowKeys.current[index] ?? index}
								className="animate-rise bg-card/80 "
							>
								<CardHeader className="flex flex-row items-center justify-between gap-3">
									<CardTitle className="flex items-center gap-2 text-sm font-medium">
										Componente
										<Badge
											variant={"outline"}
											className="text-[10px] font-semibold text-muted-foreground tabular-nums gap-0"
										>
											{index + 1}/
											<span className="text-foreground">
												{components.length}
											</span>
										</Badge>
									</CardTitle>

									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="size-8 text-muted-foreground"
										aria-label={`Eliminar componente ${component.name || index + 1}`}
										onClick={() => removeComponent(index)}
										disabled={disabled}
									>
										<Trash2 className="size-4" />
									</Button>
								</CardHeader>

								<CardContent>
									<FieldGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_10rem]">
										<Field>
											<FieldLabel htmlFor={`component-name-${index}`}>
												Nombre
											</FieldLabel>

											<Input
												id={`component-name-${index}`}
												placeholder="Ej. Tóner negro"
												value={component.name}
												onChange={(event) =>
													updateComponent(index, { name: event.target.value })
												}
												disabled={disabled}
											/>
										</Field>

										<Field>
											<FieldLabel htmlFor={`component-part-number-${index}`}>
												Número de parte
											</FieldLabel>

											<Input
												id={`component-part-number-${index}`}
												placeholder="Ej. CF258A"
												value={component.partNumber}
												onChange={(event) =>
													updateComponent(index, {
														partNumber: event.target.value,
													})
												}
												disabled={disabled}
											/>
										</Field>

										<Field>
											<FieldLabel htmlFor={`component-type-${index}`}>
												Tipo
											</FieldLabel>

											<Select
												itemToStringLabel={(
													value: DeviceComponentInput["type"],
												) =>
													({
														supply: "Consumible",
														replacement_part: "Repuesto",
														other: "Otro",
													})[value]
												}
												value={component.type}
												onValueChange={(value) =>
													updateComponent(index, {
														type: value as DeviceComponentInput["type"],
													})
												}
												disabled={disabled}
											>
												<SelectTrigger
													id={`component-type-${index}`}
													className="w-full"
												>
													<SelectValue />
												</SelectTrigger>

												<SelectContent>
													{COMPONENT_TYPE_OPTIONS.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															{option.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</Field>
									</FieldGroup>
								</CardContent>
							</Card>
						))}
					</FieldGroup>
				)}

				{hasError && <FieldError className="text-xs" errors={errors} />}
			</FieldContent>
		</Field>
	);
}
