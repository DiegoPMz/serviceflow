import { createFileRoute } from "@tanstack/react-router";
import { NewWorkspaceLoading } from "@/features/workpace/pages/new-workspace-loading";
import { NewWorkspacePage } from "@/features/workpace/pages/new-workspace-page";

export const Route = createFileRoute("/_authenticated/workspace/crear")({
	component: NewWorkspacePage,
	pendingComponent: NewWorkspaceLoading,
	pendingMs: 200,
});
