/** biome-ignore-all lint/style/noNonNullAssertion: <> */
import { useAuth } from "@clerk/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { Toaster } from "./shared/components/ui/sonner";

const router = createRouter({
	routeTree,
	context: {
		auth: undefined!,
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

	return (
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} context={{ auth: auth }} />
			<Toaster />
		</QueryClientProvider>
	);
}

export default App;
