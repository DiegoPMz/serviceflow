import { SignIn } from "@clerk/react";
import { shadcn } from "@clerk/ui/themes";
import { useSearch } from "@tanstack/react-router";

export function LoginPage() {
	const { redirect: redirectUrl } = useSearch({ from: "/login" });

	return (
		<div className="flex min-h-screen items-center justify-center">
			<SignIn appearance={shadcn} fallbackRedirectUrl={redirectUrl || "/"} />
		</div>
	);
}
