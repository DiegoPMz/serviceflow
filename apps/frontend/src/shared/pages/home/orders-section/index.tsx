import { useParams, useRouteContext, useSearch } from "@tanstack/react-router";
import { useGetPaginatedOrders } from "@/features/order/paginated-orders";
import { Presence } from "@/shared/components/presence";
import { OrderCard } from "./order-card";
import { OrderSectionHeader } from "./order-section-header";
import { OrderSectionLoadingState } from "./order-section-loading-state";
import { OrdersEmptyState } from "./orders-empty-state";
import { OrdersErrorState } from "./orders-error-state";
import { OrdersPagination } from "./orders-pagination";
import { SearchOrdersForm } from "./search-orders.form";

const HOME_ROUTE = "/_authenticated/workspace/$workspaceId/" as const;

export function OrdersSection() {
	const { eden } = useRouteContext({ from: HOME_ROUTE });
	const orderPaginationInput = useSearch({ from: HOME_ROUTE });
	const { workspaceId } = useParams({ from: HOME_ROUTE });

	const { data, isPending, isError, isFetching, refetch } =
		useGetPaginatedOrders(eden, {
			pageSize: 5,
			workspaceId,
			direction: "desc",
			page: orderPaginationInput.page ?? 1,
			search: orderPaginationInput.search,
			status: orderPaginationInput.status,
		});

	if (isPending) {
		return <OrderSectionLoadingState />;
	}

	const hasErrorWithoutData = isError && !data;

	return (
		<section className="animate-rise min-h-120 flex flex-col rounded-xl border border-border/70 bg-card p-4 sm:p-5 xl:h-180 xl:max-h-180">
			<OrderSectionHeader />

			<SearchOrdersForm />

			<div className="mt-3 h-full lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
				{hasErrorWithoutData ? (
					<OrdersErrorState
						onRetry={() => void refetch()}
						isRetrying={isFetching}
					/>
				) : (
					<div className="space-y-2">
						{data.items.length > 0 ? (
							data.items.map((order) => (
								<OrderCard key={order.id} order={order} />
							))
						) : (
							<OrdersEmptyState
								hasFilters={Boolean(
									orderPaginationInput.search?.trim() ||
										orderPaginationInput.status,
								)}
							/>
						)}
					</div>
				)}
			</div>

			<Presence show={Boolean(data && data.items.length > 0)}>
				{data ? <OrdersPagination pagination={data} /> : null}
			</Presence>
		</section>
	);
}
