import { cn } from "cn";
import { Plus } from "lucide-react";
import { type PropsWithChildren, useState } from "react";
import {
	RegisterClientDialog,
	type RegisterClientDialogProps,
} from "@/features/client/register-client";
import type { Eden } from "../http/client";
import { Button } from "./ui/button";

type RegisterClientButtonProps = {
	className?: string;
	eden: Eden;
	workspaceId: string;
} & Pick<RegisterClientDialogProps, "onRegistered">;

export function RegisterClientButton({
	children,
	className,
	eden,
	workspaceId,
	onRegistered,
}: PropsWithChildren<RegisterClientButtonProps>) {
	const [openModal, setOpenModal] = useState(false);

	return (
		<>
			<Button
				onClick={() => setOpenModal(true)}
				size="lg"
				className={cn(className)}
			>
				<Plus className="size-4" />
				{children ?? "Nuevo cliente"}
			</Button>

			<RegisterClientDialog
				open={openModal}
				onOpenChange={setOpenModal}
				eden={eden}
				workspaceId={workspaceId}
				onRegistered={onRegistered}
			/>
		</>
	);
}
