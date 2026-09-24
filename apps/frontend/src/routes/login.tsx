import { SignIn } from "@clerk/react";
import { shadcn } from "@clerk/ui/themes";
import { createFileRoute, redirect } from "@tanstack/react-router";
import * as v from "valibot";

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
	component: LoginComponent,
});

function LoginComponent() {
	const { redirect: redirectUrl } = Route.useSearch();

	return (
		<div className="flex min-h-screen items-center justify-center">
			<SignIn appearance={shadcn} fallbackRedirectUrl={redirectUrl || "/"} />
		</div>
	);
}
