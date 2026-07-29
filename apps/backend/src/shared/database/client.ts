import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { dbConfig } from "../config";
import * as schema from "./schema";

const client = createClient({
	url: dbConfig.url,
	authToken: dbConfig.authToken,
});

export const db = drizzle(client, { schema });

export type DatabaseClient = Parameters<
	Parameters<DatabaseType["transaction"]>[0]
>[0];

export type DatabaseType = typeof db;
