import { useEffect, useState } from "react";
import { Input } from "@/shared/components/ui/input";

type QuantityInputProps = {
	id: string;
	value: number;
	onChange: (quantity: number) => void;
};

export function QuantityInput({ id, value, onChange }: QuantityInputProps) {
	const [draft, setDraft] = useState(String(value));

	useEffect(() => {
		setDraft(String(value));
	}, [value]);

	return (
		<Input
			id={id}
			type="number"
			min={1}
			step={1}
			inputMode="numeric"
			value={draft}
			className="h-9 w-full"
			onChange={(event) => {
				const next = event.target.value;
				const parsed = Number.parseInt(next, 10);

				setDraft(next);

				if (Number.isInteger(parsed) && parsed >= 1) {
					onChange(parsed);
				}
			}}
			onBlur={() => {
				const parsed = Number.parseInt(draft, 10);
				const safeQuantity =
					Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;

				setDraft(String(safeQuantity));
				onChange(safeQuantity);
			}}
		/>
	);
}
