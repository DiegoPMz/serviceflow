import * as v from "valibot";

const EnvSchema = v.object({
	VITE_CLERK_PUBLISHABLE_KEY: v.string(),
});

const values = await v.parseAsync(EnvSchema, import.meta.env);

export const clerkConfig = {
	publishableKey: values.VITE_CLERK_PUBLISHABLE_KEY,
};
