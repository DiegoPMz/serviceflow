import { type Static, Type } from "@sinclair/typebox";

export const listActivitiesQuerySchema = Type.Object({
	limit: Type.Optional(
		Type.Number({
			minimum: 1,
			maximum: 50,
			description: "Número de actividades recientes a consultar.",
		}),
	),
});

export type ListActivitiesQuery = Static<typeof listActivitiesQuerySchema>;
