import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/workspace/$workspaceId/equipo')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/ws/$workspaceId/equipo"!</div>
}
