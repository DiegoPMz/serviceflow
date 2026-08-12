import { Type } from "@sinclair/typebox";

export interface PaginationRequestOptions<T extends string = string> {
	orderBy?: readonly T[] | T[];
	defaultLimit?: number;
	defaultOrderBy?: T;
	defaultDirection?: "asc" | "desc";
}

export const paginationRequestSchema = <T extends string>({
	orderBy,
	defaultLimit = 10,
	defaultDirection = "desc",
}: PaginationRequestOptions<T> = {}) => {
	const orderByUnion =
		!orderBy || orderBy.length === 0
			? Type.Literal("id")
			: Type.Union(orderBy.map((field) => Type.Literal(field)));

	return Type.Object({
		limit: Type.Number({
			minimum: 1,
			maximum: 100,
			default: defaultLimit,
		}),
		orderBy: Type.Optional(orderByUnion),
		direction: Type.Optional(
			Type.Union([Type.Literal("asc"), Type.Literal("desc")], {
				default: defaultDirection,
			}),
		),
		search: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
		cursor: Type.Optional(Type.String()),
	});
};
