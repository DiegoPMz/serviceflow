import {
	createFileRoute,
	Outlet,
	useMatchRoute,
	useNavigate,
} from "@tanstack/react-router";
import { cn } from "cn";
import { useState } from "react";
import { useGetPaginatedClients } from "@/features/client/paginated-clients";
import { RegisterClientButton } from "@/shared/components/register-client-button";
import { useDebouncedValue } from "@/shared/lib/use-debounced-value";
import {
	ClientDirectory,
	ClientDirectoryError,
	ClientDirectoryErrorNotice,
	ClientDirectorySkeleton,
	ClientsPageLayout,
} from "@/shared/pages/clients";

export const Route = createFileRoute(
	"/_authenticated/workspace/$workspaceId/clientes",
)({
	component: RouteComponent,
});

function RouteComponent() {
	const { workspaceId } = Route.useParams();
	const { eden } = Route.useRouteContext();

	const matchRoute = useMatchRoute();
	const navigate = useNavigate();

	const detailMatch = matchRoute({
		to: "/workspace/$workspaceId/clientes/$clientId",
		fuzzy: false,
	});

	const selectedClientId = detailMatch ? detailMatch.clientId : undefined;
	const hasSelection = Boolean(selectedClientId);

	const [query, setQuery] = useState("");
	const debouncedQuery = useDebouncedValue(query, 400);

	const {
		data,
		isLoading,
		isError,
		hasNextPage,
		fetchNextPage,
		isFetching,
		isFetchingNextPage,
		isFetchNextPageError,
		isRefetchError,
		refetch,
	} = useGetPaginatedClients(eden, {
		workspaceId,
		orderBy: "name",
		direction: "asc",
		limit: 20,
		search: debouncedQuery.trim() || undefined,
	});

	const clients = (data?.pages.flatMap((page) => page.items) ?? []).map(
		(client) => ({
			id: client.id,
			name: client.name,
			email: client.email,
			phone: client.phoneNumber,
			address: client.location,
			ordersCount: client.ordersCount,
			lastOrder: client.lastOrder,
		}),
	);

	const handleLoadMore = () => {
		if (!hasNextPage || isFetching) return;

		void fetchNextPage();
	};

	const handleRetry = () => {
		void refetch();
	};

	const handleSelectClient = (clientId: string) => {
		void navigate({
			to: "/workspace/$workspaceId/clientes/$clientId",
			params: { workspaceId, clientId },
		});
	};

	return (
		<ClientsPageLayout eden={eden} workspaceId={workspaceId}>
			<section
				className={cn(
					"min-w-0 xl:col-start-1 xl:row-start-1 min-h-full",
					!hasSelection && "hidden xl:grid",
				)}
			>
				<Outlet />
			</section>

			{isLoading && !data ? (
				<ClientDirectorySkeleton
					items={4}
					className={cn(
						"min-w-0 xl:col-start-2 xl:row-start-1 xl:h-[calc(100dvh-12rem)]",
						hasSelection && "hidden xl:block",
					)}
				/>
			) : isError && !data ? (
				<div
					className={cn(
						"min-w-0 xl:col-start-2 xl:row-start-1",
						hasSelection && "hidden xl:block",
					)}
				>
					<ClientDirectoryError onRetry={handleRetry} />
				</div>
			) : (
				<div
					className={cn(
						"min-w-0 xl:col-start-2 xl:row-start-1",
						hasSelection && "hidden xl:block xl:sticky xl:top-[10%]",
					)}
				>
					<div className={"flex justify-end mb-4 xl:hidden"}>
						<RegisterClientButton
							className="w-full sm:w-fit"
							workspaceId={workspaceId}
							eden={eden}
						/>
					</div>

					<ClientDirectory className="xl:h-[calc(100dvh-12rem)] animate-rise">
						<ClientDirectory.Header>
							<div className="mb-2 flex items-center justify-between gap-2">
								<ClientDirectory.Title />
								<ClientDirectory.Count count={clients.length} />
							</div>

							<ClientDirectory.Search value={query} onValueChange={setQuery} />
						</ClientDirectory.Header>

						<ClientDirectory.List>
							{isRefetchError && !isFetchNextPageError && (
								<ClientDirectoryErrorNotice onRetry={handleRetry} />
							)}

							{clients.length === 0 ? (
								<ClientDirectory.Empty
									query={query}
									onClear={() => setQuery("")}
								/>
							) : (
								<ul className="grid min-w-0 grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-1">
									{clients.map((client) => (
										<li key={client.id} className="min-w-0">
											<ClientDirectory.Item
												client={client}
												active={client.id === selectedClientId}
												onClick={() => handleSelectClient(client.id)}
											>
												<ClientDirectory.Item.Heading />
												<ClientDirectory.Item.Contact />
												<ClientDirectory.Item.LastOrder />
											</ClientDirectory.Item>
										</li>
									))}
								</ul>
							)}
						</ClientDirectory.List>

						{hasNextPage && clients.length > 0 && (
							<ClientDirectory.Pagination
								totalCount={clients.length}
								isLoading={isFetchingNextPage}
								hasError={isFetchNextPageError}
								onLoadMore={handleLoadMore}
							/>
						)}
					</ClientDirectory>
				</div>
			)}
		</ClientsPageLayout>
	);
}
