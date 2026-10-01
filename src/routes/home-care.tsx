import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/home-care')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/home-care"!</div>
}
