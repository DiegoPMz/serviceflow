import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";

interface SelectOrderStatusProps {
	value: OrderTypes | "";
	onChange: (value: OrderTypes | "") => void;
	name?: string;
}

export function SelectOrderStatus({
	value,
	name,
	onChange,
}: SelectOrderStatusProps) {
	return (
		<Select
			name={name}
			value={value}
			onValueChange={(value) => onChange(value as OrderTypes)}
		>
			<SelectTrigger className="w-full ">
				<SelectValue placeholder="Todas" />
			</SelectTrigger>

			<SelectContent>
				<SelectGroup>
					<SelectLabel>Estado</SelectLabel>

					{STATUS_ITEMS.map((item) => (
						<SelectItem key={item.value} value={item.value}>
							{item.label}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

export type OrderTypes = "Pendiente" | "Entregada" | "Cancelada";
const STATUS_ITEMS = [
	{ label: "Todas", value: null },
	{ label: "Pendiente", value: "Pendiente" },
	{ label: "Entregada", value: "Entregada" },
	{ label: "Cancelada", value: "Cancelada" },
];
