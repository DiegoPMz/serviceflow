import { spawnSync } from "bun";
import postgres from "postgres";

console.log("\n=== 🔌 INITIALIZING TEST DATABASE SETUP ===");

const sql = postgres(process.env.DATABASE_BASE_URL!, { max: 1 });

try {
	const res =
		await sql`SELECT 1 FROM pg_database WHERE datname='tecnofix_test'`;

	if (res.length === 0) {
		console.log("🛠️ Creating 'tecnofix_test' database...");
		await sql`CREATE DATABASE tecnofix_test`;
		console.log("✅ 'tecnofix_test' database created successfully.");
	} else {
		console.log(
			"♻️ 'tecnofix_test' database already exists. Recreating to wipe all schemas...",
		);

		await sql`DROP DATABASE tecnofix_test WITH (FORCE)`;
		await sql`CREATE DATABASE tecnofix_test`;

		console.log(
			"✅ 'tecnofix_test' database recreated and cleaned successfully.",
		);
	}
} catch (error) {
	console.error("❌ Critical error verifying/creating test database:", error);
	process.exit(1);
} finally {
	await sql.end();
}

console.log("🚀 Applying Drizzle schema to the test database...");

const { success } = spawnSync(["bun", "drizzle-kit", "push", "--force"], {
	stdout: "inherit",
	stderr: "inherit",
	env: {
		...process.env,
	},
});

if (!success) {
	console.error("❌ Critical error: Failed to apply Drizzle migrations.");
	process.exit(1);
}

console.log("=== 🎉 SETUP COMPLETED, STARTING TESTS ===\n");
