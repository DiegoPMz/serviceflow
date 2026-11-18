import { CLIENT_ERROR_CODES } from "@serviceflow/error-codes";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { toast } from "sonner";
import {
	getClientDetailsQueryOptions,
	useGetClientDetails,
} from "@/features/client/client-details";
import { ApiError } from "@/shared/lib/api-error";
import {
	ClientDetailsCard,
	ClientDetailsCardSkeleton,
	ClientDetailsLayout,
	ClientDetailsLayoutSkeleton,
	ClientDevicesSection,
	ClientDevicesSectionSkeleton,
} from "@/shared/pages/clients";

export const Route = createFileRoute(
	"/_authenticated/workspace/$workspaceId/clientes/$clientId",
)({
	loader: async ({ context, params }) => {
		try {
			await context.queryClient.query({
				...getClientDetailsQueryOptions(context.eden, params),
				staleTime: "static",
			});
		} catch (error) {
			if (
				error instanceof ApiError &&
				error.code === CLIENT_ERROR_CODES.NOT_FOUND
			) {
				toast.error("No pudimos acceder a este cliente.", {
					description:
						"El cliente no existe o ya no está disponible en este espacio.",
				});

				throw redirect({
					to: "/workspace/$workspaceId/clientes",
					params: { workspaceId: params.workspaceId },
				});
			}

			throw error;
		}
	},
	component: RouteComponent,
	pendingComponent: () => (
		<ClientDetailsLayoutSkeleton>
			<ClientDetailsCardSkeleton />
			<ClientDevicesSectionSkeleton />
		</ClientDetailsLayoutSkeleton>
	),
	pendingMs: 250,
});

function RouteComponent() {
	const { eden } = Route.useRouteContext();
	const { workspaceId, clientId } = Route.useParams();

	const { data: client } = useGetClientDetails(eden, {
		workspaceId,
		clientId,
	});

	return (
		<ClientDetailsLayout workspaceId={workspaceId}>
			<ClientDetailsCard client={client} />

			<ClientDevicesSection
				eden={eden}
				workspaceId={workspaceId}
				clientId={clientId}
			/>
		</ClientDetailsLayout>
	);
}
