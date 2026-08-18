import { Value } from "@sinclair/typebox/value";
import { type Env, envSchema } from "./env.schema";

const raw = Value.Parse(envSchema, process.env) as Env;

export const dbConfig = {
	url: raw.TURSO_CONNECTION_URL,
	authToken: raw.TURSO_AUTH_TOKEN,
} as const;

export const r2Config = {
	endpoint: raw.R2_ENDPOINT,
	accessKeyId: raw.R2_ACCESS_KEY_ID,
	secretAccessKey: raw.R2_SECRET_ACCESS_KEY,
} as const;

export const r2StorageConfig = {
	bucketName: raw.R2_BUCKET_NAME,
	publicDomain: raw.R2_PUBLIC_DOMAIN,
} as const;

export const clerkConfig = {
	secretKey: raw.CLERK_SECRET_KEY,
	jwksUrl: raw.CLERK_JWKS_URL,
	issuer: raw.CLERK_ISSUER,
};

export const resendConfig = {
	apiKey: raw.RESEND_API_KEY,
	fromDomain: raw.RESEND_FROM_DOMAIN,
};

export const appConfig = {
	url: raw.FRONTEND_URL,
	invitationCallbackPath: raw.FRONTEND_INVITATION_CALLBACK_PATH,
};
