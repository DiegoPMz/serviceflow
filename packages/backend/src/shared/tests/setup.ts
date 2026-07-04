import postgres from "postgres";

export default async function globalSetup() {
	const testDbUrl = process.env.DATABASE_URL;
	if (!testDbUrl)
		throw new Error("❌ DATABASE_URL not found in the test environment.");

	const baseDbUrl = testDbUrl.replace(/\/tecnofix_test$/, "/postgres");

	const sql = postgres(baseDbUrl, { max: 1, debug: true });

	const res =
		await sql`SELECT 1 FROM pg_database WHERE datname='tecnofix_test'`;

	if (res.length === 0) {
		console.log("🛠️ Creating test database (tecnofix_test)...");
		await sql`CREATE DATABASE tecnofix_test`;
	}

	await sql.end();

	const { success, stderr } = Bun.spawnSync(["bun", "drizzle-kit", "migrate"], {
		env: {
			...process.env,
			DATABASE_URL: testDbUrl,
		},
	});

	if (!success) {
		console.error(
			"❌ Error while running drizzle-kit migrations. Please check the error below:",
		);
		console.error(stderr?.toString());
		process.exit(1);
	}
}
