import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/discharge')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/discharge"!</div>
}
