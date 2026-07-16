import { ErrorDetails, Result } from "../../result";
import type { DatabaseClient } from "../client";

export const executeInTransaction = async <R>(
	db: DatabaseClient,
	cb: (tx: DatabaseClient) => Promise<Result<R>>,
): Promise<Result<R>> => {
	try {
		return await db.transaction(async (tx) => {
			const result = await cb(tx);

			// 2. CRUCIAL: Si tu callback devuelve un Result.failure,
			// Drizzle NO va a hacer rollback automáticamente porque no se lanzó una excepción.
			// Tenemos que forzar el rollback lanzando el error interno si el resultado falló.
			if (result.isFailure) {
				throw result.error; // Asumiendo que tu ErrorDetails está aquí
			}

			return result;
		});
	} catch (error: unknown) {
		// 3. Capturamos el error del rollback o cualquier fallo de la base de datos
		if (error instanceof ErrorDetails) {
			return Result.failure<R>(error);
		}

		// Si es un error inesperado (ej. caída de red de Turso), lo manejamos o relanzamos
		// return Result.failure<R>(ErrorDetails.from(error));
		throw error;
	}
};
