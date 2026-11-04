import { useEffect, useState } from "react";

/**
 * Devuelve el valor recibido retrasado `delay` ms.
 * Útil para búsquedas server-side que no deben dispararse en cada tecla.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedValue(value), delay);

		return () => clearTimeout(timer);
	}, [value, delay]);

	return debouncedValue;
}
