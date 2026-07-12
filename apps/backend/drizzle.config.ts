import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/shared/database/schema/index.ts",
	out: "./src/shared/database/migrations",
	dialect: "turso",
	dbCredentials: {
		url: process.env.TURSO_CONNECTION_URL!,
		authToken: process.env.TURSO_AUTH_TOKEN!,
	},
	verbose: true,
	strict: true,
});
