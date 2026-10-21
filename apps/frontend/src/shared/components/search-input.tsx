import { cn } from "cn";
import { SearchIcon } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";

type SearchInput = Omit<React.ComponentProps<"input">, "type">;

export function SearchInput({ className, ...props }: SearchInput) {
	return (
		<InputGroup>
			<InputGroupInput
				aria-label="Buscar órdenes de servicio"
				id="inline-start-input"
				placeholder="Buscar por folio, cliente o dispositivo…"
				className={cn("text-sm", className)}
				type="search"
				{...props}
			/>
			<InputGroupAddon align="inline-start">
				<SearchIcon className="h-4 w-4 text-muted-foreground" />
			</InputGroupAddon>
		</InputGroup>
	);
}
