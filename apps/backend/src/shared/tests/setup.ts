import { afterAll, beforeAll, mock } from "bun:test";
import { type Client, createClient } from "@libsql/client";
import * as originalDatabaseModule from "@serviceflow/backend/shared/database";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { GenericContainer, type StartedTestContainer } from "testcontainers";
import * as schema from "../database/schema";

// propiedades globales para persistir la conexión entre archivos de test
declare global {
	var __TEST_CONTAINER__: StartedTestContainer | undefined;
	var __LIBSQL_CLIENT__: Client | undefined;
	var __TEST_DB__: any | undefined;
}

beforeAll(async () => {
	if (!globalThis.__TEST_CONTAINER__) {
		console.log("🚀 Iniciando contenedor compartido de libSQL...");

		globalThis.__TEST_CONTAINER__ = await new GenericContainer(
			"ghcr.io/tursodatabase/libsql-server:latest",
		)
			.withExposedPorts(8080)
			.withEnvironment({ SQLD_NODE: "primary" })
			.start();

		const host = globalThis.__TEST_CONTAINER__.getHost();
		const port = globalThis.__TEST_CONTAINER__.getMappedPort(8080);
		const connectionUrl = `ws://${host}:${port}`;

		globalThis.__LIBSQL_CLIENT__ = createClient({ url: connectionUrl });
		globalThis.__TEST_DB__ = drizzle(globalThis.__LIBSQL_CLIENT__, {
			schema: schema,
		});

		await migrate(globalThis.__TEST_DB__, {
			migrationsFolder: "./src/shared/database/migrations",
		});
		console.log("🛠️ Migraciones aplicadas con éxito en el contenedor.");
	}

	mock.module("@serviceflow/backend/shared/database", () => {
		return {
			...originalDatabaseModule,
			db: globalThis.__TEST_DB__,
		};
	});
});

afterAll(async () => {
	if (globalThis.__LIBSQL_CLIENT__) {
		globalThis.__LIBSQL_CLIENT__.close();
	}
});
