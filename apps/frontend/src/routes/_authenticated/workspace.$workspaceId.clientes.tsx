import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/workspace/$workspaceId/clientes',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/ws/$workspaceId/clientes"!</div>
}
