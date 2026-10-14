import { createFileRoute } from "@tanstack/react-router";
import { NewWorkspaceLoading } from "@/shared/pages/new-workspace/new-workspace-loading";
import { NewWorkspacePage } from "@/shared/pages/new-workspace/new-workspace-page";

export const Route = createFileRoute("/_authenticated/workspace/crear")({
	component: NewWorkspacePage,
	pendingComponent: NewWorkspaceLoading,
	pendingMs: 200,
});
