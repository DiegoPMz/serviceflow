import { OrderSectionHeader } from "./order-section-header";
import { OrdersSectionSkeleton } from "./orders-section-skeleton";

export function OrderSectionLoadingState() {
	return (
		<section className="animate-rise min-h-120 flex flex-col rounded-xl border border-border/70 bg-card p-4 sm:p-5 xl:h-180 xl:max-h-180">
			<OrderSectionHeader />
			<OrdersSectionSkeleton />
		</section>
	);
}
