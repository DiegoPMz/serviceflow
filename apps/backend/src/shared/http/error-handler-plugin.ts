import Elysia from "elysia";
import { ErrorDetails, ErrorDetailsException } from "../result";

export const errorPlugin = new Elysia({
	name: "error-handler",
}).onError({ as: "global" }, ({ code, error, status }) => {
	if (code === "VALIDATION") {
		const details = error.all.reduce(
			(acc, err) => {
				const field = err.path.slice(1).replace(/\//g, ".") || "root";

				const customError = (
					err.schema as { error?: string | ((err: unknown) => string) }
				)?.error;

				const message =
					typeof customError === "string"
						? customError
						: typeof customError === "function"
							? customError(err)
							: err.summary || err.message;

				acc[field] = message;
				return acc;
			},
			{} as Record<string, string>,
		);

		return status(400, {
			...new ErrorDetails(
				"VALIDATION_ERROR",
				"Los datos enviados en la solicitud no son válidos",
				400,
				details,
			),
		});
	}

	if (code === "NOT_FOUND") {
		return status(404, {
			...new ErrorDetails(
				"ENDPOINT_NOT_FOUND",
				"El endpoint solicitado no existe",
				404,
			),
		});
	}

	if (error instanceof ErrorDetailsException) {
		console.log(error);
	}

	return status(500, {
		...new ErrorDetails(
			"INTERNAL_SERVER_ERROR",
			"Ocurrió un error inesperado en el servidor",
			500,
		),
	});
});
