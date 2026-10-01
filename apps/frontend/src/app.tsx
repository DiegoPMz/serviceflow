/** biome-ignore-all lint/style/noNonNullAssertion: <> */
import { useAuth } from "@clerk/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { useEffect, useMemo, useRef } from "react";
import { routeTree } from "./routeTree.gen";
import { Toaster } from "./shared/components/ui/sonner";
import { createEden } from "./shared/http/client";

const router = createRouter({
	routeTree,
	context: {
		auth: undefined!,
		eden: undefined!,
		queryClient: undefined!,
	},
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const queryClient = new QueryClient();

export function App() {
	const auth = useAuth();

	const getTokenRef = useRef(auth.getToken);

	useEffect(() => {
		getTokenRef.current = auth.getToken;
	});

	const eden = useMemo(() => {
		if (!auth.isLoaded) return null;

		return createEden({
			getToken: async () => getTokenRef.current(),
		});
	}, [auth.isLoaded]);

	if (!auth.isLoaded) {
		return <AppLoading />;
	}

	return (
		<QueryClientProvider client={queryClient}>
			<RouterProvider
				router={router}
				context={{
					auth: auth,
					eden: eden!,
					queryClient,
				}}
			/>
			<Toaster />
		</QueryClientProvider>
	);
}

export default App;

function AppLoading() {
	return (
		<div className="flex min-h-svh flex-col bg-background">
			<header className="flex h-14 items-center border-b px-4">
				<div className="h-5 w-28 animate-pulse rounded bg-muted" />
			</header>

			<main className="flex flex-1 items-center justify-center">
				<div className="flex items-center gap-3">
					<div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
					<span className="text-sm text-muted-foreground">Cargando...</span>
				</div>
			</main>
		</div>
	);
}
