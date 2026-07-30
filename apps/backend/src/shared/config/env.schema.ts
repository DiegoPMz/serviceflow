import { type Static, Type } from "@sinclair/typebox";

export const envSchema = Type.Object({
	TURSO_CONNECTION_URL: Type.String({ minLength: 1 }),
	TURSO_AUTH_TOKEN: Type.String({ minLength: 1 }),
	R2_ENDPOINT: Type.String({ minLength: 1 }),
	R2_ACCESS_KEY_ID: Type.String({ minLength: 1 }),
	R2_SECRET_ACCESS_KEY: Type.String({ minLength: 1 }),
	R2_BUCKET_NAME: Type.String({ minLength: 1 }),
	R2_PUBLIC_DOMAIN: Type.String({ minLength: 1 }),
	CLERK_SECRET_KEY: Type.String({ minLength: 1 }),
	CLERK_JWKS_URL: Type.String({ minLength: 1 }),
	CLERK_ISSUER: Type.String({ minLength: 1 }),
});

export type Env = Static<typeof envSchema>;
