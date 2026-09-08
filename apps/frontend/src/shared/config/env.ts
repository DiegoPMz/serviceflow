import * as v from "valibot";

const EnvSchema = v.object({
	VITE_CLERK_PUBLISHABLE_KEY: v.string(),
	VITE_API_URL: v.string(),
});

const values = await v.parseAsync(EnvSchema, import.meta.env);

export const clerkConfig = {
	publishableKey: values.VITE_CLERK_PUBLISHABLE_KEY,
};

export const apiConfig = {
	url: values.VITE_API_URL,
};
