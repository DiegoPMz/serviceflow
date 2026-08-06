import { describe, expect, test } from "bun:test";
import Elysia, { t } from "elysia";
import type { ApiErrorResponse } from "./api-response";
import { errorPlugin } from "./error-handler-plugin";

describe("Error Handler Plugin", () => {
	const app = new Elysia()
		.use(errorPlugin)
		.post("/test-validation", () => "ok", {
			body: t.Object({
				email: t.String({
					format: "email",
					error: "El formato del correo electrónico no es válido",
				}),
				age: t.Number({
					error: "La edad debe ser un número válido",
				}),
			}),
		})
		.get("/test-crash", () => {
			throw new Error("Unhandled database connection failure");
		});

	const isoTimestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

	test("should handle schema validation errors and return a 400 response with formatted details", async () => {
		const response = await app.handle(
			new Request("http://localhost/test-validation", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: "invalid-email-string",
					age: "not-a-number",
				}),
			}),
		);

		const body = await response.json();

		expect(body).toEqual({
			success: false,
			error: {
				code: "VALIDATION_ERROR",
				message: "Los datos enviados en la solicitud no son válidos",
				details: {
					email: "El formato del correo electrónico no es válido",
					age: "La edad debe ser un número válido",
				},
				timestamp: expect.stringMatching(isoTimestampRegex),
			},
		});
	});

	test("should handle unmapped routes and return a 404 response", async () => {
		const response = await app.handle(
			new Request("http://localhost/non-existent-route", {
				method: "GET",
			}),
		);

		expect(response.status).toBe(404);

		const body = (await response.json()) as ApiErrorResponse;

		expect(body).toEqual({
			success: false,
			error: {
				code: "ENDPOINT_NOT_FOUND",
				message: "El endpoint solicitado no existe",
				timestamp: expect.stringMatching(isoTimestampRegex),
			},
		});
	});

	test("should catch unhandled exceptions and return a generic 500 server error response", async () => {
		const response = await app.handle(
			new Request("http://localhost/test-crash", {
				method: "GET",
			}),
		);

		expect(response.status).toBe(500);

		const body = (await response.json()) as ApiErrorResponse;

		expect(body).toEqual({
			success: false,
			error: {
				code: "INTERNAL_SERVER_ERROR",
				message: "Ocurrió un error inesperado en el servidor",
				timestamp: expect.stringMatching(isoTimestampRegex),
			},
		});
	});
});
