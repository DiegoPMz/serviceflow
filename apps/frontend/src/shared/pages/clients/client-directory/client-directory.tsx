import { cn } from "cn";
import type { ReactNode } from "react";
import {
	ClientDirectoryCount,
	ClientDirectoryHeader,
	ClientDirectorySearch,
	ClientDirectoryTitle,
} from "./client-directory-header";
import { ClientDirectoryItem } from "./client-directory-item";
import {
	ClientDirectoryEmpty,
	ClientDirectoryList,
} from "./client-directory-list";
import { ClientDirectoryPagination } from "./client-directory-pagination";

type ClientDirectoryProps = {
	children: ReactNode;
	className?: string;
};

function ClientDirectoryRoot({ children, className }: ClientDirectoryProps) {
	return (
		<aside
			aria-label="Directorio de clientes"
			className={cn(
				"flex min-w-0 flex-col rounded-xl",
				"border border-border/70 bg-card",
				"overflow-visible p-4 pt-0 sm:p-5 sm:pt-0",
				"xl:min-h-0 xl:overflow-hidden",
				className,
			)}
		>
			{children}
		</aside>
	);
}

export const ClientDirectory = Object.assign(ClientDirectoryRoot, {
	Header: ClientDirectoryHeader,
	Title: ClientDirectoryTitle,
	Count: ClientDirectoryCount,
	Search: ClientDirectorySearch,

	List: ClientDirectoryList,
	Empty: ClientDirectoryEmpty,

	Item: ClientDirectoryItem,

	Pagination: ClientDirectoryPagination,
});
