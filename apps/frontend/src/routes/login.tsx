import { createFileRoute, redirect } from "@tanstack/react-router";
import * as v from "valibot";
import { LoginPage } from "@/features/auth/pages/login-page";

const loginSearchSchema = v.object({
	redirect: v.optional(v.string()),
});

export const Route = createFileRoute("/login")({
	validateSearch: loginSearchSchema,
	beforeLoad: ({ context, search }) => {
		if (context.auth.isSignedIn) {
			throw redirect({ to: search.redirect ?? "/" });
		}
	},
	component: LoginPage,
});
