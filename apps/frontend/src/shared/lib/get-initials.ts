/**
 * Devuelve las iniciales de un nombre completo (máximo dos letras).
 * Ej: "Ana María López" → "AM", "" → "U".
 */
export function getInitials(name: string): string {
	const words = name.trim().split(/\s+/).filter(Boolean);

	return (
		words
			.slice(0, 2)
			.map((word) => word[0])
			.join("")
			.toUpperCase() || "U"
	);
}
