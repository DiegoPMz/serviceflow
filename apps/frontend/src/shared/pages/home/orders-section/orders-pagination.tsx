/** biome-ignore-all lint/suspicious/noArrayIndexKey: <> */

import { cn } from "cn";
import type { PaginatedOrders } from "@/features/order/paginated-orders";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/shared/components/ui/pagination";

type OrdersPaginationProps = {
	pagination: PaginatedOrders;
};

export function OrdersPagination({ pagination }: OrdersPaginationProps) {
	const { page, pageSize, totalItems, totalPages } = pagination;

	const hasItems = totalItems > 0;
	const pageCount = Math.max(1, totalPages);
	const currentPage = Math.min(Math.max(page, 1), pageCount);

	const firstItem = hasItems ? (currentPage - 1) * pageSize + 1 : 0;
	const lastItem = hasItems ? Math.min(currentPage * pageSize, totalItems) : 0;

	const canGoPrevious = hasItems && currentPage > 1;
	const canGoNext = hasItems && currentPage < pageCount;

	const pages = getVisiblePages(currentPage, pageCount);

	const formatNumber = (value: number) =>
		new Intl.NumberFormat("es-MX").format(value);

	return (
		<div className="flex w-full flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
			{/* Results summary */}
			<p
				role="status"
				aria-live="polite"
				className="text-center text-xs text-muted-foreground sm:flex-1 sm:text-left"
			>
				{hasItems ? (
					<>
						Mostrando{" "}
						<span className="font-medium text-foreground tabular-nums">
							{formatNumber(firstItem)}–{formatNumber(lastItem)}
						</span>{" "}
						de {formatNumber(totalItems)} órdenes
					</>
				) : (
					"No hay órdenes para mostrar."
				)}
			</p>

			<Pagination className="mx-auto w-full justify-center sm:mx-0 sm:w-auto">
				<PaginationContent className="gap-1">
					{/* Previous */}
					<PaginationItem>
						<PaginationPrevious
							from="/workspace/$workspaceId"
							to="/workspace/$workspaceId"
							search={(prev) => ({
								...prev,
								page: currentPage - 1,
							})}
							text="Anterior"
							size="lg"
							aria-label="Página anterior"
							aria-disabled={!canGoPrevious}
							className={cn(
								"text-xs",
								!canGoPrevious && "pointer-events-none opacity-40",
							)}
						/>
					</PaginationItem>

					{/* Page numbers: tablet and desktop */}
					{pages.map((item, index) => (
						<PaginationItem
							key={`${item}-${index}`}
							className="hidden  sm:flex"
						>
							{item === "ellipsis" ? (
								<PaginationEllipsis />
							) : (
								<PaginationLink
									from="/workspace/$workspaceId"
									to="/workspace/$workspaceId"
									search={(prev) => ({
										...prev,
										page: item,
									})}
									isActive={item === currentPage}
									aria-label={`Ir a la página ${item}`}
									aria-current={item === currentPage ? "page" : undefined}
									size="icon-lg"
								>
									{item}
								</PaginationLink>
							)}
						</PaginationItem>
					))}

					{/* Current page: mobile */}
					<PaginationItem className="sm:hidden">
						<span className="flex h-9 min-w-12 items-center justify-center px-2 font-mono text-xs tabular-nums text-muted-foreground">
							{hasItems ? `${currentPage}/${pageCount}` : "—"}
						</span>
					</PaginationItem>

					{/* Next */}
					<PaginationItem>
						<PaginationNext
							from="/workspace/$workspaceId"
							to="/workspace/$workspaceId"
							search={(prev) => ({
								...prev,
								page: currentPage + 1,
							})}
							text="Siguiente"
							size="lg"
							aria-label="Página siguiente"
							aria-disabled={!canGoNext}
							className={cn(
								"text-xs",
								!canGoNext && "pointer-events-none opacity-40",
							)}
						/>
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		</div>
	);
}

function getVisiblePages(
	currentPage: number,
	totalPages: number,
): (number | "ellipsis")[] {
	if (totalPages <= 5) {
		return Array.from({ length: totalPages }, (_, index) => index + 1);
	}

	const pages = new Set([
		1,
		totalPages,
		currentPage - 1,
		currentPage,
		currentPage + 1,
	]);

	const visiblePages = [...pages]
		.filter((page) => page >= 1 && page <= totalPages)
		.sort((a, b) => a - b);

	const result: (number | "ellipsis")[] = [];

	for (let index = 0; index < visiblePages.length; index++) {
		const current = visiblePages[index] ?? 1;
		const previous = visiblePages[index - 1];

		if (previous !== undefined && current - previous > 1) {
			result.push("ellipsis");
		}

		result.push(current);
	}

	return result;
}
