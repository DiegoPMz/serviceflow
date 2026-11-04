import { cn } from "cn";
import { Trash2 } from "lucide-react";
import type { DeviceComponentListItem } from "@/features/device/paginated-device-components";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import {
	COMPONENT_BADGE_CLASSES,
	COMPONENT_TYPE_LABELS,
} from "./consumables.presentation";
import { QuantityInput } from "./quantity-input";

type ConsumableCardProps = {
	id: string;
	quantity: number;
	component?: DeviceComponentListItem;
	onQuantityChange: (quantity: number) => void;
	onRemove: () => void;
};

export function ConsumableCard({
	id,
	quantity,
	component,
	onQuantityChange,
	onRemove,
}: ConsumableCardProps) {
	const quantityInputId = `consumable-qty-${id}`;

	return (
		<Card className="ring-0 shadow-none rounded-none">
			{/* Información del componente */}
			<CardHeader className="flex flex-row items-start justify-between gap-3 ">
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<div className="flex min-w-0 flex-wrap items-center gap-2">
						<CardTitle className="truncate text-sm font-medium leading-normal">
							{component?.name ?? "Componente"}
						</CardTitle>

						<Badge
							variant="outline"
							className={cn(
								"shrink-0 border-2 text-[10px] font-semibold",
								COMPONENT_BADGE_CLASSES[component?.type ?? "other"],
							)}
						>
							{component ? COMPONENT_TYPE_LABELS[component.type] : "Componente"}
						</Badge>
					</div>

					<CardDescription className="truncate flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
						Número de parte:{" "}
						<span className="truncate font-medium text-foreground">
							{component?.partNumber || "Sin número de parte"}
						</span>
					</CardDescription>
				</div>

				<Button
					type="button"
					size="icon-lg"
					variant="ghost"
					className="-mr-2 -mt-2 shrink-0"
					aria-label={`Eliminar ${component?.name ?? "componente"}`}
					onClick={onRemove}
				>
					<Trash2 className="size-4 text-muted-foreground" />
				</Button>
			</CardHeader>

			{/* Cantidad */}
			<CardContent>
				<div className="border-t border-border/70 pt-3">
					<Field orientation={"horizontal"} className="max-w-37.5">
						<FieldLabel
							htmlFor={quantityInputId}
							className="text-xs font-normal text-muted-foreground"
						>
							Cantidad
						</FieldLabel>

						<QuantityInput
							id={quantityInputId}
							value={quantity}
							onChange={onQuantityChange}
						/>
					</Field>
				</div>
			</CardContent>
		</Card>
	);
}
