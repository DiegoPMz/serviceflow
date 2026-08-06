import Elysia from "elysia";
import type { ApiErrorResponse } from "./api-response";

export const errorPlugin = new Elysia({
	name: "error-handler",
}).onError({ as: "global" }, ({ code, error, status }) => {
	const timestamp = new Date().toISOString();

	if (code === "VALIDATION") {
		const details = error.all.reduce(
			(acc, err) => {
				const field = err.path.slice(1).replace(/\//g, ".") || "root";

				const customError = (err.schema as { error?: string | Function })
					?.error;

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

		const payload: ApiErrorResponse = {
			success: false,
			error: {
				code: "VALIDATION_ERROR",
				message: "Los datos enviados en la solicitud no son válidos",
				details,
				timestamp,
			},
		};

		return status(400, payload);
	}

	if (code === "NOT_FOUND") {
		const payload: ApiErrorResponse = {
			success: false,
			error: {
				code: "ENDPOINT_NOT_FOUND",
				message: "El endpoint solicitado no existe",
				timestamp,
			},
		};

		return status(404, payload);
	}

	const payload: ApiErrorResponse = {
		success: false,
		error: {
			code: "INTERNAL_SERVER_ERROR",
			message: "Ocurrió un error inesperado en el servidor",
			timestamp,
		},
	};

	return status(500, payload);
});
